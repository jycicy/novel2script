import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from schemas.requests import (
    ConvertRequest, ConvertResponse, UsageInfo,
    BatchConvertRequest, BatchConvertResponse,
)
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


@router.post("/api/convert/batch", response_model=BatchConvertResponse)
async def convert_batch(req: BatchConvertRequest):
    screenplays = []
    success = 0
    fail = 0
    prev_characters = None

    for item in req.chapters:
        system_prompt, user_content = build_conversion_prompt(
            item.chapter_text,
            [c.model_dump() for c in prev_characters] if prev_characters else None,
        )
        try:
            raw_yaml = await llm_service.convert_chapter(user_content, system_prompt)
        except Exception:
            fail += 1
            continue

        screenplay, errors = validate_screenplay_yaml(raw_yaml)
        if screenplay is None:
            fail += 1
            continue

        screenplays.append(screenplay)
        prev_characters = screenplay.characters
        success += 1

    return BatchConvertResponse(
        screenplays=screenplays,
        success_count=success,
        fail_count=fail,
    )


async def _stream_convert(chapters):
    prev_characters = None
    success = 0
    fail = 0

    for i, item in enumerate(chapters):
        system_prompt, user_content = build_conversion_prompt(
            item.chapter_text,
            [c.model_dump() for c in prev_characters] if prev_characters else None,
        )
        try:
            raw_yaml = await llm_service.convert_chapter(user_content, system_prompt)
        except Exception:
            fail += 1
            yield json.dumps({"type": "error", "index": item.chapter_index, "title": item.title, "error": "LLM 调用失败"})
            continue

        screenplay, errors = validate_screenplay_yaml(raw_yaml)
        if screenplay is None:
            fail += 1
            yield json.dumps({"type": "error", "index": item.chapter_index, "title": item.title, "error": "YAML 校验失败"})
            continue

        prev_characters = screenplay.characters
        success += 1
        yield json.dumps({
            "type": "chapter_done",
            "index": item.chapter_index,
            "title": item.title,
            "screenplay": screenplay.model_dump(),
            "progress": f"{success + fail}/{len(chapters)}",
        })

    yield json.dumps({"type": "done", "success_count": success, "fail_count": fail})


@router.post("/api/convert/stream")
async def convert_stream(req: BatchConvertRequest):
    return StreamingResponse(
        _stream_convert(req.chapters),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
