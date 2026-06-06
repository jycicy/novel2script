from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from pathlib import Path

from schemas.requests import ValidateRequest, ValidateResponse
from services.yaml_validator import validate_screenplay_yaml

router = APIRouter()

SCHEMA_PATH = Path(__file__).parent.parent / "schemas" / "screenplay_schema.yaml"


@router.post("/api/validate", response_model=ValidateResponse)
async def validate_yaml(req: ValidateRequest):
    screenplay, errors = validate_screenplay_yaml(req.yaml_text)
    return ValidateResponse(
        valid=screenplay is not None,
        errors=errors,
        screenplay=screenplay,
    )


@router.get("/api/schema")
async def get_schema():
    if SCHEMA_PATH.exists():
        content = SCHEMA_PATH.read_text(encoding="utf-8")
        return PlainTextResponse(content, media_type="text/yaml")
    return PlainTextResponse("# Schema file not found", status_code=404)
