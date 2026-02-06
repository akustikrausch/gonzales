"""Network stability analyzer for smart scheduling decisions."""

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
import math
from typing import Protocol


class MeasurementLike(Protocol):
    """Protocol for measurement objects."""

    download_mbps: float
    upload_mbps: float
    ping_latency_ms: float
    ping_jitter_ms: float
    timestamp: datetime
    below_download_threshold: bool
    below_upload_threshold: bool


@dataclass
class StabilityMetrics:
    """Current stability metrics."""

    download_cv: float = 0.0
    upload_cv: float = 0.0
    ping_cv: float = 0.0
    stability_score: float = 0.5
    anomaly_rate: float = 0.0
    sample_count: int = 0


class StabilityAnalyzer:
    """Analyzes network measurements to determine stability.

    Uses rolling windows and statistical analysis to:
    - Calculate stability scores (0-1, higher = more stable)
    - Detect anomalies using z-scores
    - Track trends for adaptive scheduling
    """

    def __init__(
        self,
        window_size: int = 10,
        anomaly_z_threshold: float = 2.5,
    ) -> None:
        self._window_size = window_size
        self._anomaly_z_threshold = anomaly_z_threshold

        # Rolling windows for metrics
        self._downloads: deque[float] = deque(maxlen=window_size)
        self._uploads: deque[float] = deque(maxlen=window_size)
        self._pings: deque[float] = deque(maxlen=window_size)
        self._jitters: deque[float] = deque(maxlen=window_size)
        self._timestamps: deque[datetime] = deque(maxlen=window_size)

        # Running statistics for anomaly detection
        self._dl_running_mean: float = 0.0
        self._dl_running_std: float = 0.0
        self._ul_running_mean: float = 0.0
        self._ul_running_std: float = 0.0
        self._ping_running_mean: float = 0.0
        self._ping_running_std: float = 0.0

        # Tracking
        self._current_score: float = 0.5
        self._anomaly_count: int = 0
        self._total_count: int = 0

    @property
    def current_score(self) -> float:
        """Return current stability score (0-1, higher = more stable)."""
        return self._current_score

    @property
    def sample_count(self) -> int:
        """Return number of samples in the window."""
        return len(self._downloads)

    @property
    def metrics(self) -> StabilityMetrics:
        """Return current stability metrics."""
        dl_cv = self._coefficient_of_variation(list(self._downloads))
        ul_cv = self._coefficient_of_variation(list(self._uploads))
        ping_cv = self._coefficient_of_variation(list(self._pings))
        anomaly_rate = self._anomaly_count / max(1, self._total_count)

        return StabilityMetrics(
            download_cv=dl_cv,
            upload_cv=ul_cv,
            ping_cv=ping_cv,
            stability_score=self._current_score,
            anomaly_rate=anomaly_rate,
            sample_count=len(self._downloads),
        )

    def add_measurement(self, measurement: MeasurementLike) -> float:
        """Add a measurement and return updated stability score.

        Args:
            measurement: Speed test measurement

        Returns:
            Updated stability score (0-1)
        """
        self._downloads.append(measurement.download_mbps)
        self._uploads.append(measurement.upload_mbps)
        self._pings.append(measurement.ping_latency_ms)
        self._jitters.append(measurement.ping_jitter_ms)
        self._timestamps.append(measurement.timestamp)

        self._total_count += 1

        # Update running statistics
        self._update_running_stats()

        # Calculate stability score
        self._current_score = self._calculate_stability_score()

        return self._current_score

    def is_anomaly(self, measurement: MeasurementLike) -> bool:
        """Check if measurement is an anomaly.

        Uses z-score analysis and threshold checks to detect anomalies.

        Args:
            measurement: Speed test measurement

        Returns:
            True if measurement is anomalous
        """
        if len(self._downloads) < 5:
            # Not enough data - only flag extreme cases
            return (
                measurement.below_download_threshold
                or measurement.below_upload_threshold
            )

        is_anomaly = False
        reasons = []

        # Check download z-score (negative = below average)
        if self._dl_running_std > 0:
            dl_z = self._calculate_z_score(
                measurement.download_mbps,
                self._dl_running_mean,
                self._dl_running_std,
            )
            if dl_z < -self._anomaly_z_threshold:
                is_anomaly = True
                reasons.append(f"download_z={dl_z:.2f}")

        # Check upload z-score
        if self._ul_running_std > 0:
            ul_z = self._calculate_z_score(
                measurement.upload_mbps,
                self._ul_running_mean,
                self._ul_running_std,
            )
            if ul_z < -self._anomaly_z_threshold:
                is_anomaly = True
                reasons.append(f"upload_z={ul_z:.2f}")

        # Check ping z-score (positive = above average = bad)
        if self._ping_running_std > 0:
            ping_z = self._calculate_z_score(
                measurement.ping_latency_ms,
                self._ping_running_mean,
                self._ping_running_std,
            )
            if ping_z > self._anomaly_z_threshold:
                is_anomaly = True
                reasons.append(f"ping_z={ping_z:.2f}")

        # Also flag threshold violations
        if measurement.below_download_threshold:
            is_anomaly = True
            reasons.append("below_dl_threshold")

        if measurement.below_upload_threshold:
            is_anomaly = True
            reasons.append("below_ul_threshold")

        if is_anomaly:
            self._anomaly_count += 1

        return is_anomaly

    def get_anomaly_details(self, measurement: MeasurementLike) -> dict:
        """Get detailed anomaly analysis for a measurement."""
        if len(self._downloads) < 3:
            return {
                "is_anomaly": False,
                "reason": "insufficient_data",
                "z_scores": {},
            }

        z_scores = {}
        anomaly_reasons = []

        if self._dl_running_std > 0:
            dl_z = self._calculate_z_score(
                measurement.download_mbps,
                self._dl_running_mean,
                self._dl_running_std,
            )
            z_scores["download"] = round(dl_z, 2)
            if dl_z < -self._anomaly_z_threshold:
                anomaly_reasons.append("download_drop")

        if self._ul_running_std > 0:
            ul_z = self._calculate_z_score(
                measurement.upload_mbps,
                self._ul_running_mean,
                self._ul_running_std,
            )
            z_scores["upload"] = round(ul_z, 2)
            if ul_z < -self._anomaly_z_threshold:
                anomaly_reasons.append("upload_drop")

        if self._ping_running_std > 0:
            ping_z = self._calculate_z_score(
                measurement.ping_latency_ms,
                self._ping_running_mean,
                self._ping_running_std,
            )
            z_scores["ping"] = round(ping_z, 2)
            if ping_z > self._anomaly_z_threshold:
                anomaly_reasons.append("ping_spike")

        if measurement.below_download_threshold:
            anomaly_reasons.append("below_download_threshold")
        if measurement.below_upload_threshold:
            anomaly_reasons.append("below_upload_threshold")

        return {
            "is_anomaly": len(anomaly_reasons) > 0,
            "reasons": anomaly_reasons,
            "z_scores": z_scores,
            "thresholds": {
                "z_threshold": self._anomaly_z_threshold,
            },
            "running_stats": {
                "download_mean": round(self._dl_running_mean, 2),
                "download_std": round(self._dl_running_std, 2),
                "upload_mean": round(self._ul_running_mean, 2),
                "upload_std": round(self._ul_running_std, 2),
                "ping_mean": round(self._ping_running_mean, 2),
                "ping_std": round(self._ping_running_std, 2),
            },
        }

    def _calculate_stability_score(self) -> float:
        """Calculate overall stability score (0-1).

        Higher score = more stable network.
        Uses coefficient of variation weighted by importance.
        """
        if len(self._downloads) < 3:
            return 0.5  # Neutral score with insufficient data

        # Calculate coefficient of variation for each metric
        dl_cv = self._coefficient_of_variation(list(self._downloads))
        ul_cv = self._coefficient_of_variation(list(self._uploads))
        ping_cv = self._coefficient_of_variation(list(self._pings))

        # Weight: Download matters most, then upload, then ping
        # CV values typically 0-0.5, higher = more variable
        weighted_cv = dl_cv * 0.5 + ul_cv * 0.3 + ping_cv * 0.2

        # Convert to stability score (low CV = high stability)
        # CV of 0 = score 1.0, CV of 0.5+ = score 0
        score = max(0, min(1, 1 - (weighted_cv * 2)))

        # Penalize for recent anomalies in window
        if self._total_count > 0:
            recent_anomaly_rate = self._anomaly_count / max(1, self._total_count)
            score *= 1 - min(0.5, recent_anomaly_rate * 0.5)

        return round(score, 3)

    def _update_running_stats(self) -> None:
        """Update running mean and std for anomaly detection."""
        if len(self._downloads) >= 3:
            dl_list = list(self._downloads)
            self._dl_running_mean = sum(dl_list) / len(dl_list)
            if len(dl_list) > 1:
                variance = sum((v - self._dl_running_mean) ** 2 for v in dl_list) / (
                    len(dl_list) - 1
                )
                self._dl_running_std = math.sqrt(variance)
            else:
                self._dl_running_std = 0.0

            ul_list = list(self._uploads)
            self._ul_running_mean = sum(ul_list) / len(ul_list)
            if len(ul_list) > 1:
                variance = sum((v - self._ul_running_mean) ** 2 for v in ul_list) / (
                    len(ul_list) - 1
                )
                self._ul_running_std = math.sqrt(variance)
            else:
                self._ul_running_std = 0.0

            ping_list = list(self._pings)
            self._ping_running_mean = sum(ping_list) / len(ping_list)
            if len(ping_list) > 1:
                variance = sum((v - self._ping_running_mean) ** 2 for v in ping_list) / (
                    len(ping_list) - 1
                )
                self._ping_running_std = math.sqrt(variance)
            else:
                self._ping_running_std = 0.0

    @staticmethod
    def _coefficient_of_variation(values: list[float]) -> float:
        """Calculate coefficient of variation (std/mean).

        Returns 0 if insufficient data or mean is 0.
        """
        if not values or len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        if mean == 0:
            return 0.0
        variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
        std = math.sqrt(variance)
        return std / mean

    @staticmethod
    def _calculate_z_score(value: float, mean: float, std: float) -> float:
        """Calculate z-score for a value."""
        if std == 0:
            return 0.0
        return (value - mean) / std

    def reset(self) -> None:
        """Reset analyzer state."""
        self._downloads.clear()
        self._uploads.clear()
        self._pings.clear()
        self._jitters.clear()
        self._timestamps.clear()
        self._dl_running_mean = 0.0
        self._dl_running_std = 0.0
        self._ul_running_mean = 0.0
        self._ul_running_std = 0.0
        self._ping_running_mean = 0.0
        self._ping_running_std = 0.0
        self._current_score = 0.5
        self._anomaly_count = 0
        self._total_count = 0
