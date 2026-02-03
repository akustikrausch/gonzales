"""QoS (Quality of Service) Test Service.

Evaluates network measurements against application-specific QoS profiles.
"""
from datetime import datetime

from gonzales.db.models import Measurement
from gonzales.domain.models.qos_profiles import QOS_PROFILES, get_all_profiles, get_profile
from gonzales.schemas.qos import (
    QosCheck,
    QosHistoryEntry,
    QosHistoryOut,
    QosOverview,
    QosProfileOut,
    QosTestResult,
)


class QosService:
    """Service for QoS profile evaluation."""

    def get_all_profiles(self) -> list[QosProfileOut]:
        """Get all available QoS profiles."""
        profiles = get_all_profiles()
        return [
            QosProfileOut(
                id=p.id,
                name=p.name,
                icon=p.icon,
                description=p.description,
                min_download_mbps=p.min_download_mbps,
                min_upload_mbps=p.min_upload_mbps,
                max_ping_ms=p.max_ping_ms,
                max_jitter_ms=p.max_jitter_ms,
                max_packet_loss_pct=p.max_packet_loss_pct,
            )
            for p in profiles
        ]

    def evaluate_measurement(
        self,
        measurement: Measurement,
        profile_id: str,
    ) -> QosTestResult | None:
        """Evaluate a measurement against a specific QoS profile."""
        profile = get_profile(profile_id)
        if not profile:
            return None

        checks: list[QosCheck] = []

        # Download speed check
        if profile.min_download_mbps is not None:
            passed = measurement.download_mbps >= profile.min_download_mbps
            checks.append(QosCheck(
                metric="download",
                label="Download Speed",
                required=profile.min_download_mbps,
                actual=measurement.download_mbps,
                passed=passed,
                unit="Mbps",
                threshold_type="min",
            ))

        # Upload speed check
        if profile.min_upload_mbps is not None:
            passed = measurement.upload_mbps >= profile.min_upload_mbps
            checks.append(QosCheck(
                metric="upload",
                label="Upload Speed",
                required=profile.min_upload_mbps,
                actual=measurement.upload_mbps,
                passed=passed,
                unit="Mbps",
                threshold_type="min",
            ))

        # Ping latency check
        if profile.max_ping_ms is not None:
            passed = measurement.ping_latency_ms <= profile.max_ping_ms
            checks.append(QosCheck(
                metric="ping",
                label="Latency",
                required=profile.max_ping_ms,
                actual=measurement.ping_latency_ms,
                passed=passed,
                unit="ms",
                threshold_type="max",
            ))

        # Jitter check
        if profile.max_jitter_ms is not None:
            jitter = measurement.ping_jitter_ms
            if jitter is not None:
                passed = jitter <= profile.max_jitter_ms
                checks.append(QosCheck(
                    metric="jitter",
                    label="Jitter",
                    required=profile.max_jitter_ms,
                    actual=jitter,
                    passed=passed,
                    unit="ms",
                    threshold_type="max",
                ))

        # Packet loss check
        if profile.max_packet_loss_pct is not None:
            packet_loss = measurement.packet_loss_percent
            if packet_loss is not None:
                passed = packet_loss <= profile.max_packet_loss_pct
                checks.append(QosCheck(
                    metric="packet_loss",
                    label="Packet Loss",
                    required=profile.max_packet_loss_pct,
                    actual=packet_loss,
                    passed=passed,
                    unit="%",
                    threshold_type="max",
                ))

        # Overall result
        all_passed = all(c.passed for c in checks)
        passed_count = sum(1 for c in checks if c.passed)

        # Generate recommendation if failed
        recommendation = None
        if not all_passed:
            failed_checks = [c for c in checks if not c.passed]
            issues = []
            for check in failed_checks:
                if check.threshold_type == "min":
                    issues.append(f"{check.label} too low ({check.actual:.1f} < {check.required:.1f} {check.unit})")
                else:
                    issues.append(f"{check.label} too high ({check.actual:.1f} > {check.required:.1f} {check.unit})")
            recommendation = "; ".join(issues)

        return QosTestResult(
            profile_id=profile_id,
            profile_name=profile.name,
            icon=profile.icon,
            passed=all_passed,
            checks=checks,
            passed_count=passed_count,
            total_checks=len(checks),
            recommendation=recommendation,
        )

    def evaluate_all_profiles(
        self,
        measurement: Measurement,
    ) -> QosOverview:
        """Evaluate a measurement against all QoS profiles."""
        results: list[QosTestResult] = []

        for profile_id in QOS_PROFILES:
            result = self.evaluate_measurement(measurement, profile_id)
            if result:
                results.append(result)

        passed_profiles = sum(1 for r in results if r.passed)
        total_profiles = len(results)

        # Generate summary
        if passed_profiles == total_profiles:
            summary = "All applications optimal"
        elif passed_profiles == 0:
            summary = "No applications meet requirements"
        else:
            summary = f"{passed_profiles} of {total_profiles} applications optimal"

        return QosOverview(
            measurement_id=measurement.id,
            timestamp=measurement.timestamp,
            results=results,
            passed_profiles=passed_profiles,
            total_profiles=total_profiles,
            summary=summary,
        )

    def get_profile_history(
        self,
        measurements: list[Measurement],
        profile_id: str,
    ) -> QosHistoryOut | None:
        """Get QoS compliance history for a specific profile."""
        profile = get_profile(profile_id)
        if not profile:
            return None

        entries: list[QosHistoryEntry] = []
        passed_count = 0

        for m in sorted(measurements, key=lambda x: x.timestamp):
            result = self.evaluate_measurement(m, profile_id)
            if result:
                entries.append(QosHistoryEntry(
                    timestamp=m.timestamp,
                    measurement_id=m.id,
                    passed=result.passed,
                    download_mbps=m.download_mbps,
                    upload_mbps=m.upload_mbps,
                    ping_ms=m.ping_latency_ms,
                    jitter_ms=m.ping_jitter_ms,
                    packet_loss_pct=m.packet_loss_percent,
                ))
                if result.passed:
                    passed_count += 1

        total = len(entries)
        compliance_pct = (passed_count / total * 100) if total > 0 else 0

        return QosHistoryOut(
            profile_id=profile_id,
            profile_name=profile.name,
            entries=entries,
            compliance_pct=round(compliance_pct, 1),
            total_tests=total,
            passed_tests=passed_count,
        )


# Singleton instance
qos_service = QosService()
