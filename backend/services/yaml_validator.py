import yaml
from pydantic import ValidationError as PydanticValidationError

from schemas.screenplay import Screenplay
from schemas.requests import ValidationError


def validate_screenplay_yaml(raw_yaml: str) -> tuple[Screenplay | None, list[ValidationError]]:
    errors: list[ValidationError] = []

    try:
        data = yaml.safe_load(raw_yaml)
    except yaml.YAMLError as e:
        line = getattr(e, "problem_mark", None)
        line_num = line.line + 1 if line else None
        errors.append(ValidationError(line=line_num, message=f"YAML 解析错误: {e}"))
        return None, errors

    if not isinstance(data, dict):
        errors.append(ValidationError(message="YAML 根元素必须是对象"))
        return None, errors

    try:
        screenplay = Screenplay(**data)
    except PydanticValidationError as e:
        for err in e.errors():
            loc = " → ".join(str(x) for x in err["loc"])
            errors.append(ValidationError(message=f"{loc}: {err['msg']}"))
        return None, errors

    return screenplay, []


def repair_common_yaml_errors(raw: str) -> str:
    lines = raw.split("\n")
    repaired: list[str] = []

    for line in lines:
        stripped = line.rstrip()
        if stripped and not stripped.endswith(":") and ":" in stripped:
            key_part, _, value_part = stripped.partition(":")
            if value_part and not value_part.startswith(" "):
                stripped = f"{key_part}: {value_part}"
        repaired.append(stripped)

    return "\n".join(repaired)
