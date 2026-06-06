from pydantic import BaseModel
from typing import Optional

from .screenplay import Character, Screenplay


class ChapterInfo(BaseModel):
    index: int
    title: str
    content: str
    start_line: int
    end_line: int
    char_count: int


class ChapterDetectRequest(BaseModel):
    text: str


class ChapterDetectResponse(BaseModel):
    chapters: list[ChapterInfo]
    total_chars: int


class ConvertRequest(BaseModel):
    chapter_text: str
    chapter_index: int
    title: str
    previous_characters: Optional[list[Character]] = None


class UsageInfo(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0


class ConvertResponse(BaseModel):
    screenplay: Screenplay
    usage: UsageInfo


class ValidateRequest(BaseModel):
    yaml_text: str


class ValidationError(BaseModel):
    line: Optional[int] = None
    message: str


class ValidateResponse(BaseModel):
    valid: bool
    errors: list[ValidationError] = []
    screenplay: Optional[Screenplay] = None
