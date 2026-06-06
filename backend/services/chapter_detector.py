import re
from dataclasses import dataclass


@dataclass
class ChapterInfo:
    index: int
    title: str
    content: str
    start_line: int
    end_line: int
    char_count: int


PATTERNS = [
    re.compile(r"^(第[一二三四五六七八九十百千零\d]+[章节回卷])\s*(.*)", re.MULTILINE),
    re.compile(r"^(Chapter\s+\d+)\s*(.*)", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(\d+\.\s+.+)", re.MULTILINE),
    re.compile(r"^(第[一二三四五六七八九十百千零\d]+节)\s*(.*)", re.MULTILINE),
]


def detect_chapters(text: str, min_chapter_length: int = 100) -> list[ChapterInfo]:
    if not text.strip():
        return []

    lines = text.split("\n")

    matches: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        for pattern in PATTERNS:
            m = pattern.match(stripped)
            if m:
                title = m.group(0).strip()
                matches.append((i, title))
                break

    if not matches:
        chunk_size = 2000
        chunks: list[ChapterInfo] = []
        for idx, start in enumerate(range(0, len(text), chunk_size)):
            end = min(start + chunk_size, len(text))
            chunk_text = text[start:end]
            chunks.append(ChapterInfo(
                index=idx,
                title=f"片段 {idx + 1}",
                content=chunk_text,
                start_line=0,
                end_line=0,
                char_count=len(chunk_text),
            ))
        return chunks

    chapters: list[ChapterInfo] = []
    for idx, (line_num, title) in enumerate(matches):
        next_start = matches[idx + 1][0] if idx + 1 < len(matches) else len(lines)
        chapter_lines = lines[line_num:next_start]
        chapter_text = "\n".join(chapter_lines)

        if len(chapter_text) < min_chapter_length and idx < len(matches) - 1:
            continue

        chapters.append(ChapterInfo(
            index=idx,
            title=title,
            content=chapter_text,
            start_line=line_num,
            end_line=next_start - 1,
            char_count=len(chapter_text),
        ))

    return chapters
