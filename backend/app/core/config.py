from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Cloakroom.ai API"
    # Use SQLite by default for local/dev and tests; override in production.
    DATABASE_URL: str = "sqlite:///./cloakroom.db"
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    S3_BUCKET_NAME: str = "cloakroom-assets"
    STATIC_BASE_URL: str = "http://localhost:8000"
    VTON_API_URL: str = "https://api.replicate.com/v1/predictions"
    VTON_API_KEY: str | None = None
    ENABLE_MOCK_VTON: bool = True
    VTON_MODEL_VERSION: str = "replace-with-provider-model-version"
    CORS_ALLOW_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()