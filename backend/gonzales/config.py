from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GONZALES_", env_file=".env", extra="ignore")

    host: str = "127.0.0.1"
    port: int = 8470
    test_interval_minutes: int = 5
    download_threshold_mbps: float = 1000.0
    upload_threshold_mbps: float = 500.0
    log_level: str = "INFO"
    debug: bool = False

    db_path: Path = Path("gonzales.db")
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8470"]
    speedtest_binary: str = "speedtest"
    manual_trigger_cooldown_seconds: int = 60

    @property
    def database_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.db_path}"


settings = Settings()
