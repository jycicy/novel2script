from pathlib import Path

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.txt"
    return path.read_text(encoding="utf-8")


def build_conversion_prompt(
    chapter_text: str, previous_characters: list[dict] | None = None
) -> tuple[str, str]:
    system_prompt = load_prompt("convert_chapter")

    user_content = chapter_text
    if previous_characters:
        char_info = "\n".join(
            f"- {c['id']}: {c['name']} ({c['role']})"
            for c in previous_characters
        )
        user_content = (
            f"前一章已出场角色（如再次出场请使用相同的 id）:\n{char_info}\n\n"
            f"章节正文:\n{chapter_text}"
        )

    return system_prompt, user_content
