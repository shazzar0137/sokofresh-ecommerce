"""The OpenAPI contract in shared/contracts/ is generated from the code (ADR-0004).

test_committed_contract_matches_the_code is the drift check: it fails when an
API change was made without regenerating the contract. Regenerate with:

    uv run python manage.py spectacular --file ../shared/contracts/openapi.yaml --validate
"""

from pathlib import Path

import pytest
import yaml
from django.core.management import call_command

CONTRACT = Path(__file__).resolve().parents[3] / "shared" / "contracts" / "openapi.yaml"


@pytest.fixture(scope="module")
def generated(tmp_path_factory) -> str:
    out = tmp_path_factory.mktemp("contract") / "openapi.yaml"
    call_command("spectacular", "--file", str(out), "--validate", "--fail-on-warn")
    return out.read_text(encoding="utf-8")


def test_schema_is_valid_and_has_the_health_endpoint(generated):
    schema = yaml.safe_load(generated)
    assert schema["info"]["title"] == "SokoFresh API"
    assert "/api/v1/health" in schema["paths"]
    assert all(p.startswith("/api/v1/") for p in schema["paths"]), "only /api/v1 is public API"


def test_every_operation_documents_problem_details_errors(generated):
    schema = yaml.safe_load(generated)
    assert "ProblemDetail" in schema["components"]["schemas"]
    methods = {"get", "post", "put", "patch", "delete"}
    for path_item in schema["paths"].values():
        for method, operation in path_item.items():
            if method in methods:
                assert {"4XX", "5XX"} <= set(operation["responses"])


def test_error_codes_are_published_as_an_enum(generated):
    """API-7: the frontend can switch on a typed list of codes."""
    from apps.core.exceptions import PROBLEM_CODES

    schema = yaml.safe_load(generated)
    code = schema["components"]["schemas"]["ProblemDetail"]["properties"]["code"]
    assert code["enum"] == list(PROBLEM_CODES)
    assert {"validation_error", "not_authenticated", "csrf_failed", "rate_limited"} <= set(
        code["enum"]
    )


def test_committed_contract_matches_the_code(generated):
    assert CONTRACT.is_file(), f"missing {CONTRACT}; generate it (see module docstring)"
    assert CONTRACT.read_text(encoding="utf-8") == generated, (
        "shared/contracts/openapi.yaml is out of date; regenerate it (see module docstring)"
    )


def test_every_code_the_code_can_emit_is_published():
    """RQA-7: codes used in exceptions.py and views.py are all in PROBLEM_CODES."""
    import re
    from pathlib import Path

    from apps.core import exceptions

    used = {code for _, code in exceptions._CODE_BY_EXCEPTION}
    core = Path(exceptions.__file__).parent
    pattern = (
        r"(?:code = |_problem_json\(\s*\d+, |problem_response\(\s*\d+, |problem\(\d+, )"
        r'"([a-z_]+)"'
    )
    for name in ("exceptions.py", "views.py"):
        used |= set(re.findall(pattern, (core / name).read_text()))
    assert used, "pattern found no codes"
    assert used <= set(exceptions.PROBLEM_CODES), used - set(exceptions.PROBLEM_CODES)
