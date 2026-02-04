from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
    download_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    upload_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

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
    connection_type: Mapped[str] = mapped_column(String(20), nullable=False, default="unknown")
    mac_address: Mapped[str] = mapped_column(String(17), nullable=False, default="")

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


class NetworkTopology(Base):
    """Traceroute analysis result."""

    __tablename__ = "network_topology"
    __table_args__ = (Index("ix_network_topology_timestamp", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    target_host: Mapped[str] = mapped_column(String(255), nullable=False)
    total_hops: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    local_network_ok: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    diagnosis: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Optional link to a measurement
    measurement_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("measurements.id"), nullable=True
    )

    hops: Mapped[list["NetworkHop"]] = relationship(
        "NetworkHop", back_populates="topology", cascade="all, delete-orphan"
    )


class NetworkHop(Base):
    """Single hop in a traceroute."""

    __tablename__ = "network_hops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    topology_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("network_topology.id"), nullable=False
    )
    hop_number: Mapped[int] = mapped_column(Integer, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    packet_loss_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_local: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_timeout: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    topology: Mapped["NetworkTopology"] = relationship("NetworkTopology", back_populates="hops")


class Outage(Base):
    """Historical outage record for tracking internet connectivity failures."""

    __tablename__ = "outages"
    __table_args__ = (Index("ix_outages_started_at", "started_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    failure_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    trigger_error: Mapped[str] = mapped_column(Text, nullable=False, default="")
    resolution_measurement_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("measurements.id"), nullable=True
    )
