from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    llm_api_key: str = ""
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_model: str = "deepseek-chat"
    llm_max_tokens: int = 8192
    llm_temperature: float = 0.3
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_prefix": "N2S_"}


settings = Settings()
