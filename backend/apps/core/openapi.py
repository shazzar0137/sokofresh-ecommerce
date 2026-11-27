"""OpenAPI additions: the shared ProblemDetail error schema on every operation."""

from typing import Any

from .exceptions import PROBLEM_CODES

PROBLEM_DETAIL_SCHEMA: dict[str, Any] = {
    "type": "object",
    "description": "RFC 9457 problem details. Returned for every error response.",
    "properties": {
        "type": {"type": "string", "example": "about:blank"},
        "title": {"type": "string", "example": "Validation failed"},
        "status": {"type": "integer", "example": 422},
        "detail": {"type": "string", "example": "One or more fields are invalid."},
        "code": {
            "type": "string",
            "enum": list(PROBLEM_CODES),
            "description": "Stable machine-readable error code (switch on this, not on title).",
            "example": "validation_error",
        },
        "errors": {
            "type": "array",
            "items": {"$ref": "#/components/schemas/FieldError"},
        },
    },
    "required": ["type", "title", "status", "detail", "code", "errors"],
}

FIELD_ERROR_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "field": {
            "type": "string",
            "nullable": True,
            "description": "Dotted path of the field, or null for whole-request errors.",
            "example": "phone",
        },
        "code": {"type": "string", "example": "invalid"},
        "message": {"type": "string", "example": "Enter a valid Kenyan mobile number."},
    },
    "required": ["field", "code", "message"],
}

_PROBLEM_REF = {
    "content": {
        "application/problem+json": {"schema": {"$ref": "#/components/schemas/ProblemDetail"}}
    }
}


def add_problem_details_responses(
    result: dict[str, Any], generator, request, public
) -> dict[str, Any]:
    """drf-spectacular postprocessing hook (SPECTACULAR_SETTINGS["POSTPROCESSING_HOOKS"])."""
    schemas = result.setdefault("components", {}).setdefault("schemas", {})
    schemas["ProblemDetail"] = PROBLEM_DETAIL_SCHEMA
    schemas["FieldError"] = FIELD_ERROR_SCHEMA

    for path_item in result.get("paths", {}).values():
        for method, operation in path_item.items():
            if method not in {"get", "post", "put", "patch", "delete"}:
                continue
            responses = operation.setdefault("responses", {})
            responses.setdefault("4XX", {"description": "Client error", **_PROBLEM_REF})
            responses.setdefault("5XX", {"description": "Server error", **_PROBLEM_REF})
    return result
