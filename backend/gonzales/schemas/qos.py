"""Schemas for QoS (Quality of Service) tests."""
from datetime import datetime

from pydantic import BaseModel


class QosProfileOut(BaseModel):
    """QoS profile definition for API response."""

    id: str
    name: str
    icon: str
    description: str
    min_download_mbps: float | None = None
    min_upload_mbps: float | None = None
    max_ping_ms: float | None = None
    max_jitter_ms: float | None = None
    max_packet_loss_pct: float | None = None


class QosCheck(BaseModel):
    """Individual metric check result."""

    metric: str  # "download", "upload", "ping", "jitter", "packet_loss"
    label: str  # "Download Speed", "Upload Speed", etc.
    required: float | None
    actual: float | None
    passed: bool
    unit: str  # "Mbps", "ms", "%"
    threshold_type: str  # "min" or "max"


class QosTestResult(BaseModel):
    """Result of evaluating a measurement against a QoS profile."""

    profile_id: str
    profile_name: str
    icon: str
    passed: bool
    checks: list[QosCheck]
    passed_count: int
    total_checks: int
    recommendation: str | None = None


class QosOverview(BaseModel):
    """Overview of all QoS profiles for current/specific measurement."""

    measurement_id: int | None = None
    timestamp: datetime
    results: list[QosTestResult]
    passed_profiles: int
    total_profiles: int
    summary: str


class QosHistoryEntry(BaseModel):
    """Historical QoS evaluation for a specific profile."""

    timestamp: datetime
    measurement_id: int
    passed: bool
    download_mbps: float
    upload_mbps: float
    ping_ms: float
    jitter_ms: float | None
    packet_loss_pct: float | None


class QosHistoryOut(BaseModel):
    """History of QoS compliance for a profile."""

    profile_id: str
    profile_name: str
    entries: list[QosHistoryEntry]
    compliance_pct: float
    total_tests: int
    passed_tests: int
