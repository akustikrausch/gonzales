"""
Export Data Use Case - Export measurement data in various formats.

This use case orchestrates:
1. Fetching measurements from the repository
2. Formatting data for export (CSV, JSON, PDF)
3. Generating compliance reports
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, Protocol
import csv
import io
import json

from gonzales.domain.entities import MeasurementEntity


class MeasurementRepositoryPort(Protocol):
    """Protocol for measurement access."""
    async def get_by_time_range(
        self, start: datetime, end: datetime, limit: Optional[int] = None
    ) -> list[MeasurementEntity]: ...


class ConfigPort(Protocol):
    """Protocol for configuration access."""
    def get(self, key: str, default=None): ...


@dataclass
class ExportDataInput:
    """Input for data export."""
    format: str = "csv"  # csv, json
    days: int = 30
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_raw: bool = False


@dataclass
class ExportDataOutput:
    """Output containing exported data."""
    content: str
    content_type: str
    filename: str
    record_count: int


class ExportDataUseCase:
    """
    Use case for exporting measurement data.

    Supports CSV and JSON formats with configurable time ranges.
    """

    def __init__(
        self,
        measurements: MeasurementRepositoryPort,
        config: Optional[ConfigPort] = None,
    ):
        self._measurements = measurements
        self._config = config

    async def execute(self, input_data: ExportDataInput) -> ExportDataOutput:
        """
        Export measurements in the requested format.

        Args:
            input_data: Export options

        Returns:
            ExportDataOutput with formatted data
        """
        # Determine time range
        end = input_data.end_date or datetime.utcnow()
        start = input_data.start_date or (end - timedelta(days=input_data.days))

        # Fetch measurements
        measurements = await self._measurements.get_by_time_range(start, end)

        # Generate timestamp for filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        if input_data.format == "json":
            return self._export_json(measurements, timestamp)
        else:
            return self._export_csv(measurements, timestamp)

    def _export_csv(self, measurements: list[MeasurementEntity], timestamp: str) -> ExportDataOutput:
        """Export as CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "timestamp",
            "download_mbps",
            "upload_mbps",
            "ping_ms",
            "jitter_ms",
            "packet_loss_pct",
            "server_name",
            "server_location",
            "isp",
            "below_download_threshold",
            "below_upload_threshold",
            "connection_type",
        ])

        # Data rows
        for m in measurements:
            writer.writerow([
                m.timestamp.isoformat() if m.timestamp else "",
                round(m.download_mbps, 2),
                round(m.upload_mbps, 2),
                round(m.ping_latency_ms, 2),
                round(m.ping_jitter_ms, 2),
                round(m.packet_loss_pct, 2) if m.packet_loss_pct else "",
                m.server_name,
                m.server_location,
                m.isp,
                m.below_download_threshold,
                m.below_upload_threshold,
                m.connection_type,
            ])

        return ExportDataOutput(
            content=output.getvalue(),
            content_type="text/csv",
            filename=f"gonzales_export_{timestamp}.csv",
            record_count=len(measurements),
        )

    def _export_json(self, measurements: list[MeasurementEntity], timestamp: str) -> ExportDataOutput:
        """Export as JSON format."""
        data = {
            "export_timestamp": datetime.utcnow().isoformat(),
            "record_count": len(measurements),
            "measurements": [
                {
                    "id": m.id,
                    "timestamp": m.timestamp.isoformat() if m.timestamp else None,
                    "download_mbps": round(m.download_mbps, 2),
                    "upload_mbps": round(m.upload_mbps, 2),
                    "ping_ms": round(m.ping_latency_ms, 2),
                    "jitter_ms": round(m.ping_jitter_ms, 2),
                    "packet_loss_pct": round(m.packet_loss_pct, 2) if m.packet_loss_pct else None,
                    "server": {
                        "id": m.server_id,
                        "name": m.server_name,
                        "location": m.server_location,
                        "country": m.server_country,
                    },
                    "network": {
                        "isp": m.isp,
                        "internal_ip": m.internal_ip,
                        "external_ip": m.external_ip,
                        "interface": m.interface_name,
                        "connection_type": m.connection_type,
                        "is_vpn": m.is_vpn,
                    },
                    "compliance": {
                        "below_download_threshold": m.below_download_threshold,
                        "below_upload_threshold": m.below_upload_threshold,
                    },
                    "result_url": m.result_url,
                }
                for m in measurements
            ],
        }

        return ExportDataOutput(
            content=json.dumps(data, indent=2),
            content_type="application/json",
            filename=f"gonzales_export_{timestamp}.json",
            record_count=len(measurements),
        )
