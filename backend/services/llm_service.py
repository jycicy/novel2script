import logging
import asyncio
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from config import settings

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
BASE_DELAY = 1.0


def _build_user_content(chapter_text: str, previous_characters: list[dict] | None) -> str:
    if not previous_characters:
        return chapter_text
    char_info = "\n".join(
        f"- {c['id']}: {c['name']} ({c['role']})"
        for c in previous_characters
    )
    return (
        f"PREVIOUS CHARACTERS (use same IDs if they appear):\n{char_info}\n\n"
        f"CHAPTER TEXT:\n{chapter_text}"
    )


class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )
        self.model = settings.llm_model
        self.max_tokens = settings.llm_max_tokens
        self.temperature = settings.llm_temperature

    async def convert_chapter(
        self,
        chapter_text: str,
        system_prompt: str,
        previous_characters: list[dict] | None = None,
    ) -> str:
        user_content = _build_user_content(chapter_text, previous_characters)

        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                )

                raw = response.choices[0].message.content

                if raw.startswith("```"):
                    raw = raw.split("\n", 1)[1]
                    if raw.endswith("```"):
                        raw = raw[:-3]

                return raw.strip()

            except Exception as e:
                last_error = e
                delay = BASE_DELAY * (2 ** attempt)
                logger.warning(f"LLM 调用失败 (尝试 {attempt + 1}/{MAX_RETRIES}): {e}, {delay}s 后重试")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(delay)

        raise last_error

    async def stream_chapter(
        self,
        chapter_text: str,
        system_prompt: str,
        previous_characters: list[dict] | None = None,
    ) -> AsyncGenerator[str, None]:
        """流式输出 LLM 生成的 YAML 文本，逐块 yield。"""
        user_content = _build_user_content(chapter_text, previous_characters)

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True,
        )

        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content


llm_service = LLMService()
