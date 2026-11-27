#!/usr/bin/env bash
# Real-stack smoke test (Phase 3 integration review QA-3 / ARC-6 / QA-4).
#
# Talks to the real Next.js server (`next start`), which forwards /api/v1/* and
# /_allauth/* to the real Django server running the PRODUCTION settings. It
# checks the things only the two together can show: the same-origin rewrite,
# the CSRF bootstrap and token flow, the trusted storefront origin, first-party
# cookies, and the allauth paths, cookie and header names the frontend relies on
# (frontend/src/api/csrf.ts), which are not in openapi.yaml.
#
# Usage: STOREFRONT_URL=http://127.0.0.1:3999 SITE_ORIGIN=https://www.sokofresh.example \
#        tests/end-to-end/real-stack-smoke.sh
# The caller starts both servers; see .github/workflows/real-stack-ci.yml.
set -euo pipefail

STOREFRONT_URL="${STOREFRONT_URL:?set STOREFRONT_URL, e.g. http://127.0.0.1:3999}"
SITE_ORIGIN="${SITE_ORIGIN:?set SITE_ORIGIN, the trusted storefront origin}"
ALLAUTH="$STOREFRONT_URL/_allauth/browser/v1"
WORK="$(mktemp -d)"
JAR="$WORK/cookies.txt"
FAILURES=0

# The edge (Cloudflare / host proxy) terminates TLS and sets X-Forwarded-Proto.
EDGE=(-H "X-Forwarded-Proto: https")
BROWSER=(-H "Origin: $SITE_ORIGIN" -H "Referer: $SITE_ORIGIN/sign-in")

check() {  # check <description> <expected> <actual>
  if [[ "$2" == "$3" ]]; then
    echo "PASS  $1"
  else
    echo "FAIL  $1: expected '$2', got '$3'"
    FAILURES=$((FAILURES + 1))
  fi
}

status() { curl -s -o "$WORK/body" -D "$WORK/headers" -w '%{http_code}' "$@"; }

# 1. API health through the rewrite (database reachable).
code=$(status "${EDGE[@]}" "$STOREFRONT_URL/api/v1/health")
check "GET /api/v1/health through Next.js" 200 "$code"
check "health reports the database" '"ok"' "$(grep -o '"database": *"[a-z]*"' "$WORK/body" | grep -o '"[a-z]*"$')"

# 0. Proof STOREFRONT_URL is the Next.js server, not Django itself (re-review
#    RR-4): the home page exists only in Next.js, and Permissions-Policy is set
#    only by next.config.ts. (Next.js does not add its headers to proxied
#    responses, so the rewritten API answers above cannot show this.)
code=$(status "${EDGE[@]}" "$STOREFRONT_URL/")
check "GET / is the storefront home page" 200 "$code"
check "storefront sets Permissions-Policy (Next.js only)" yes \
  "$(grep -qi '^permissions-policy:' "$WORK/headers" && echo yes || echo no)"

# 2. CSRF bootstrap exactly as the frontend does it (CSRF_BOOTSTRAP_PATH in
#    frontend/src/api/csrf.ts): allauth's config endpoint sets the csrftoken cookie.
code=$(status -c "$JAR" "${EDGE[@]}" "$ALLAUTH/config")
check "GET config (CSRF bootstrap)" 200 "$code"
cookie_line=$(grep -i '^set-cookie: csrftoken=' "$WORK/headers" || true)
check "csrftoken cookie is set" yes "$([[ -n $cookie_line ]] && echo yes || echo no)"
# The cookie checks below only mean something if the cookie exists (RR-4).
check "csrftoken cookie is first-party (no Domain)" yes \
  "$([[ -n $cookie_line ]] && ! grep -qi 'domain=' <<<"$cookie_line" && echo yes || echo no)"
check "csrftoken cookie is Secure" yes "$(grep -qi '; *secure' <<<"$cookie_line" && echo yes || echo no)"
token=$(awk '$6 == "csrftoken" {print $7}' "$JAR")
code=$(status -b "$JAR" "${EDGE[@]}" "$ALLAUTH/auth/session")
check "GET auth/session (signed out)" 401 "$code"

# 3. Sign-in code request with the token from the trusted storefront: passes CSRF.
body='{"phone":"+254712345678"}'
code=$(status -b "$JAR" -c "$JAR" "${EDGE[@]}" "${BROWSER[@]}" -H "X-CSRFToken: $token" \
  -H "Content-Type: application/json" --data "$body" "$ALLAUTH/auth/code/request")
check "POST auth/code/request from the storefront (code flow pending)" 401 "$code"
check "the pending flow is login_by_code" yes \
  "$(grep -q '"login_by_code"' "$WORK/body" && echo yes || echo no)"

# 4. Same request without the token: refused by CSRF, as RFC 9457 JSON.
code=$(status -b "$JAR" "${EDGE[@]}" "${BROWSER[@]}" -H "Content-Type: application/json" \
  --data "$body" "$ALLAUTH/auth/code/request")
check "POST without X-CSRFToken" 403 "$code"
check "CSRF failure code" yes "$(grep -q '"csrf_failed"' "$WORK/body" && echo yes || echo no)"

# 5. Same request from a foreign origin: refused.
code=$(status -b "$JAR" "${EDGE[@]}" -H "Origin: https://evil.example" \
  -H "X-CSRFToken: $token" -H "Content-Type: application/json" --data "$body" \
  "$ALLAUTH/auth/code/request")
check "POST from a foreign Origin" 403 "$code"

# 6. Password sign-in is not offered on the API (BSEC-2).
code=$(status -b "$JAR" "${EDGE[@]}" "${BROWSER[@]}" -H "X-CSRFToken: $token" \
  -H "Content-Type: application/json" --data '{"phone":"+254712345678","password":"x"}' \
  "$ALLAUTH/auth/login")
check "POST auth/login is not available" 404 "$code"
# Django's own 404 (problem JSON), not Next.js's HTML 404 for a missing rewrite (RR-4).
check "auth/login 404 comes from Django" yes \
  "$(grep -qi '^content-type: application/problem+json' "$WORK/headers" && echo yes || echo no)"

rm -rf "$WORK"
if ((FAILURES > 0)); then
  echo "$FAILURES check(s) failed"
  exit 1
fi
echo "All real-stack checks passed"
