// Tiny stand-in for Django used by the Playwright tests: it echoes what the
// Next.js rewrite forwarded, and sets a CSRF cookie like Django does.
// Never used outside tests.
import { createServer } from "node:http";

const port = Number(process.env.STUB_BACKEND_PORT ?? 8765);

createServer((req, res) => {
  const body = JSON.stringify({
    stub: true,
    method: req.method,
    path: req.url,
    cookie: req.headers.cookie ?? null,
    csrf: req.headers["x-csrftoken"] ?? null,
    forwardedHost: req.headers["x-forwarded-host"] ?? null,
  });
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Set-Cookie": "csrftoken=stub-token; Path=/; SameSite=Lax",
  });
  res.end(body);
}).listen(port, "127.0.0.1", () => console.log(`stub backend on ${port}`));
