from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = ""
    jwt_secret: str = "replace-with-a-long-random-development-secret"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if not s.database_url:
        raise RuntimeError("DATABASE_URL is not set. Copy backend/.env.example to backend/.env and set DATABASE_URL.")
    return s
