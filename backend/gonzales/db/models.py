from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from gonzales.db.base import Base


class Measurement(Base):
    __tablename__ = "measurements"
    __table_args__ = (Index("ix_measurements_timestamp", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    download_bps: Mapped[float] = mapped_column(Float, nullable=False)
    upload_bps: Mapped[float] = mapped_column(Float, nullable=False)
    download_mbps: Mapped[float] = mapped_column(Float, nullable=False)
    upload_mbps: Mapped[float] = mapped_column(Float, nullable=False)

    ping_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    ping_jitter_ms: Mapped[float] = mapped_column(Float, nullable=False)
    packet_loss_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    isp: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    server_id: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    server_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    server_location: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    server_country: Mapped[str] = mapped_column(String(100), nullable=False, default="")

    internal_ip: Mapped[str] = mapped_column(String(45), nullable=False, default="")
    external_ip: Mapped[str] = mapped_column(String(45), nullable=False, default="")
    interface_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    is_vpn: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    result_id: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    result_url: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    raw_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    below_download_threshold: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    below_upload_threshold: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class TestFailure(Base):
    __tablename__ = "test_failures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    error_type: Mapped[str] = mapped_column(String(255), nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    raw_output: Mapped[str | None] = mapped_column(Text, nullable=True)
