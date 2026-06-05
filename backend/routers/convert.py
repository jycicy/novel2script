from fastapi import APIRouter, HTTPException

from schemas.requests import ConvertRequest, ConvertResponse, UsageInfo
from services.llm_service import llm_service
from services.prompt_builder import build_conversion_prompt
from services.yaml_validator import validate_screenplay_yaml

router = APIRouter()


@router.post("/api/convert", response_model=ConvertResponse)
async def convert_chapter(req: ConvertRequest):
    system_prompt, user_content = build_conversion_prompt(
        req.chapter_text,
        [c.model_dump() for c in req.previous_characters] if req.previous_characters else None,
    )

    try:
        raw_yaml = await llm_service.convert_chapter(user_content, system_prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM 调用失败: {str(e)}")

    screenplay, errors = validate_screenplay_yaml(raw_yaml)

    if screenplay is None:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "LLM 输出不符合 Schema",
                "errors": [e.model_dump() for e in errors],
                "raw_yaml": raw_yaml,
            },
        )

    return ConvertResponse(
        screenplay=screenplay,
        usage=UsageInfo(),
    )
