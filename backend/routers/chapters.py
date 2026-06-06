from fastapi import APIRouter

from schemas.requests import ChapterDetectRequest, ChapterDetectResponse, ChapterInfo
from services.chapter_detector import detect_chapters

router = APIRouter()


@router.post("/api/detect-chapters", response_model=ChapterDetectResponse)
async def detect_chapters_endpoint(req: ChapterDetectRequest):
    results = detect_chapters(req.text)
    chapters = [
        ChapterInfo(
            index=c.index,
            title=c.title,
            content=c.content,
            start_line=c.start_line,
            end_line=c.end_line,
            char_count=c.char_count,
        )
        for c in results
    ]
    return ChapterDetectResponse(chapters=chapters, total_chars=len(req.text))
