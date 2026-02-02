import json
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

CONFIG_FILE = Path("config.json")

MUTABLE_KEYS = {
    "test_interval_minutes",
    "download_threshold_mbps",
    "upload_threshold_mbps",
    "preferred_server_id",
    "manual_trigger_cooldown_seconds",
    "theme",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GONZALES_", env_file=".env", extra="ignore")

    host: str = "127.0.0.1"
    port: int = 8470
    test_interval_minutes: int = 30
    download_threshold_mbps: float = 1000.0
    upload_threshold_mbps: float = 500.0
    log_level: str = "INFO"
    debug: bool = False

    db_path: Path = Path("gonzales.db")
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8470"]
    speedtest_binary: str = "speedtest"
    manual_trigger_cooldown_seconds: int = 60

    preferred_server_id: int = 0
    theme: str = "auto"
    api_key: str = ""

    @property
    def database_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.db_path}"

    def load_config_overrides(self) -> None:
        if not CONFIG_FILE.exists():
            return
        try:
            data = json.loads(CONFIG_FILE.read_text())
            for key in MUTABLE_KEYS:
                if key in data:
                    setattr(self, key, data[key])
        except (json.JSONDecodeError, OSError):
            pass

    def save_config(self) -> None:
        data = {key: getattr(self, key) for key in MUTABLE_KEYS}
        CONFIG_FILE.write_text(json.dumps(data, indent=2) + "\n")


settings = Settings()
settings.load_config_overrides()
