from openai import AsyncOpenAI

from config import settings


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
        user_content = chapter_text
        if previous_characters:
            char_info = "\n".join(
                f"- {c['id']}: {c['name']} ({c['role']})"
                for c in previous_characters
            )
            user_content = (
                f"PREVIOUS CHARACTERS (use same IDs if they appear):\n{char_info}\n\n"
                f"CHAPTER TEXT:\n{chapter_text}"
            )

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


llm_service = LLMService()
