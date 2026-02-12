import json
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

MUTABLE_KEYS = {
    "test_interval_minutes",
    "download_threshold_mbps",
    "upload_threshold_mbps",
    "tolerance_percent",
    "preferred_server_id",
    "manual_trigger_cooldown_seconds",
    "theme",
    "isp_name",
    "data_retention_days",
    "webhook_url",
    "scheduler_randomize",
    # Smart scheduler settings
    "smart_scheduler_enabled",
    "smart_scheduler_burst_interval",
    "smart_scheduler_daily_budget_mb",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GONZALES_", env_file=".env", extra="ignore")

    host: str = "127.0.0.1"
    port: int = 8470
    test_interval_minutes: int = 60
    download_threshold_mbps: float = 1000.0
    upload_threshold_mbps: float = 500.0
    tolerance_percent: float = 15.0  # 15% = 85% of subscribed speed is acceptable
    log_level: str = "INFO"
    debug: bool = False

    db_path: Path = Path("gonzales.db")
    config_path: Path = Path("config.json")
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8470"]
    speedtest_binary: str = "speedtest"
    manual_trigger_cooldown_seconds: int = 60

    preferred_server_id: int = 0
    theme: str = "auto"
    api_key: str = ""
    ha_addon: bool = False
    isp_name: str = ""  # Provider name for reports
    data_retention_days: int = 0  # 0 = unlimited, otherwise delete data older than N days
    webhook_url: str = ""  # Webhook URL for notifications (empty = disabled)
    scheduler_randomize: bool = False  # Add random jitter (±25%) to scheduled test times

    # Smart scheduler settings
    smart_scheduler_enabled: bool = False
    smart_scheduler_burst_interval: int = 10
    smart_scheduler_daily_budget_mb: int = 2048

    @property
    def database_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.db_path}"

    def load_config_overrides(self) -> None:
        if not self.config_path.exists():
            return
        try:
            data = json.loads(self.config_path.read_text())
            for key in MUTABLE_KEYS:
                if key in data:
                    setattr(self, key, data[key])
        except (json.JSONDecodeError, OSError):
            pass

    def save_config(self) -> None:
        data = {key: getattr(self, key) for key in MUTABLE_KEYS}
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.config_path.write_text(json.dumps(data, indent=2) + "\n")


settings = Settings()
settings.load_config_overrides()
