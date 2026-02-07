"""Root-cause analysis service for network performance issues."""

import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from gonzales.utils.math_utils import coefficient_of_variation, pearson_correlation

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from gonzales.db.models import Measurement, NetworkTopology, Outage
from gonzales.schemas.root_cause import (
    ConnectionImpact,
    HopCorrelation,
    LayerScores,
    ProblemFingerprint,
    Recommendation,
    RootCauseAnalysis,
    TimePattern,
)


class RootCauseService:
    """Correlates data from multiple sources for root-cause analysis.

    Analyzes:
    - Measurements: Speed test results over time
    - Topologies: Traceroute data for hop-level analysis
    - Outages: Historical failure patterns
    - Time patterns: Peak vs off-peak performance
    """

    async def analyze(
        self,
        session: AsyncSession,
        days: int = 30,
        min_confidence: float = 0.5,
    ) -> RootCauseAnalysis:
        """Perform comprehensive root-cause analysis.

        Args:
            session: Database session
            days: Analysis window in days
            min_confidence: Minimum confidence for fingerprints

        Returns:
            Complete root-cause analysis result
        """
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        # Fetch data
        measurements = await self._get_measurements(session, start_date)
        topologies = await self._get_topologies(session, start_date)
        outages = await self._get_outages(session, start_date)

        # Calculate layer scores
        layer_scores = self._calculate_layer_scores(measurements, topologies)

        # Detect problem fingerprints
        fingerprints = self._detect_fingerprints(
            measurements, topologies, outages, min_confidence
        )

        # Calculate hop correlations (if topology data available)
        hop_correlations = self._calculate_hop_correlations(measurements, topologies)

        # Detect time patterns
        time_pattern = self._detect_time_pattern(measurements)

        # Analyze connection type impact
        connection_impact = self._analyze_connection_impact(measurements)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            fingerprints, layer_scores, time_pattern, connection_impact
        )

        # Calculate overall health score
        health_score = self._calculate_health_score(layer_scores, fingerprints)

        # Determine primary and secondary causes
        primary_cause = None
        secondary_causes = []
        if fingerprints:
            # Sort by severity and confidence
            sorted_fingerprints = sorted(
                fingerprints,
                key=lambda f: (
                    {"critical": 0, "warning": 1, "info": 2}.get(f.severity, 3),
                    -f.confidence,
                ),
            )
            primary_cause = sorted_fingerprints[0]
            secondary_causes = sorted_fingerprints[1:]

        return RootCauseAnalysis(
            analysis_timestamp=now,
            data_window_days=days,
            measurement_count=len(measurements),
            topology_count=len(topologies),
            primary_cause=primary_cause,
            secondary_causes=secondary_causes,
            layer_scores=layer_scores,
            hop_correlations=hop_correlations,
            time_pattern=time_pattern,
            connection_impact=connection_impact,
            recommendations=recommendations,
            network_health_score=health_score,
        )

    async def _get_measurements(
        self,
        session: AsyncSession,
        start_date: datetime,
    ) -> list[Measurement]:
        """Fetch measurements in the analysis window."""
        result = await session.execute(
            select(Measurement)
            .where(Measurement.timestamp >= start_date)
            .order_by(Measurement.timestamp)
        )
        return list(result.scalars().all())

    async def _get_topologies(
        self,
        session: AsyncSession,
        start_date: datetime,
    ) -> list[NetworkTopology]:
        """Fetch topology analyses in the analysis window."""
        result = await session.execute(
            select(NetworkTopology)
            .options(selectinload(NetworkTopology.hops))
            .where(NetworkTopology.timestamp >= start_date)
            .order_by(NetworkTopology.timestamp)
        )
        return list(result.scalars().all())

    async def _get_outages(
        self,
        session: AsyncSession,
        start_date: datetime,
    ) -> list[Outage]:
        """Fetch outages in the analysis window."""
        result = await session.execute(
            select(Outage)
            .where(Outage.started_at >= start_date)
            .order_by(desc(Outage.started_at))
        )
        return list(result.scalars().all())

    def _calculate_layer_scores(
        self,
        measurements: list[Measurement],
        topologies: list[NetworkTopology],
    ) -> LayerScores:
        """Calculate health scores for each network layer (0-100).

        Higher score = healthier layer.
        """
        # Default to 80 (healthy) if no data
        dns_score = 80.0
        local_score = 80.0
        backbone_score = 80.0
        lastmile_score = 80.0
        server_score = 80.0

        if topologies:
            # DNS score: Based on first hop latency (usually DNS resolver)
            first_hop_latencies = []
            local_issues = 0
            total_topo = len(topologies)

            for topo in topologies:
                if topo.hops:
                    # First hop (hop 1-2) often includes DNS/gateway
                    early_hops = [h for h in topo.hops if h.hop_number <= 2]
                    for hop in early_hops:
                        if hop.latency_ms is not None:
                            first_hop_latencies.append(hop.latency_ms)

                    # Count local network issues
                    if not topo.local_network_ok:
                        local_issues += 1

            if first_hop_latencies:
                avg_first_hop = sum(first_hop_latencies) / len(first_hop_latencies)
                # Score: 100 if <5ms, 50 if 20ms, 0 if >50ms
                dns_score = max(0, min(100, 100 - (avg_first_hop - 5) * 2.5))

            # Local network score
            local_score = ((total_topo - local_issues) / total_topo) * 100 if total_topo > 0 else 80

            # Backbone score: Middle hops (4-10)
            backbone_latencies = []
            for topo in topologies:
                if topo.hops:
                    mid_hops = [h for h in topo.hops if 4 <= h.hop_number <= 10]
                    for hop in mid_hops:
                        if hop.latency_ms is not None:
                            backbone_latencies.append(hop.latency_ms)

            if backbone_latencies:
                avg_backbone = sum(backbone_latencies) / len(backbone_latencies)
                # Score: 100 if <30ms, 50 if 80ms, 0 if >150ms
                backbone_score = max(0, min(100, 100 - (avg_backbone - 30) * 0.83))

        if measurements:
            # Last-mile score: Based on speed consistency and threshold violations
            violations = sum(
                1 for m in measurements
                if m.below_download_threshold or m.below_upload_threshold
            )
            violation_rate = violations / len(measurements) if measurements else 0
            lastmile_score = max(0, (1 - violation_rate * 2) * 100)

            # Server score: Based on speed variation across servers
            server_speeds = defaultdict(list)
            for m in measurements:
                server_speeds[m.server_id].append(m.download_mbps)

            if len(server_speeds) > 1:
                server_avgs = [
                    sum(speeds) / len(speeds)
                    for speeds in server_speeds.values()
                    if speeds
                ]
                if server_avgs:
                    cv = self._coefficient_of_variation(server_avgs)
                    # Low variation = good server score
                    server_score = max(0, min(100, 100 - cv * 200))

        return LayerScores(
            dns_score=round(dns_score, 1),
            local_network_score=round(local_score, 1),
            isp_backbone_score=round(backbone_score, 1),
            isp_lastmile_score=round(lastmile_score, 1),
            server_score=round(server_score, 1),
        )

    def _detect_fingerprints(
        self,
        measurements: list[Measurement],
        topologies: list[NetworkTopology],
        outages: list[Outage],
        min_confidence: float,
    ) -> list[ProblemFingerprint]:
        """Detect and classify network problems."""
        fingerprints = []

        # DNS Issues Detection
        dns_fp = self._detect_dns_issues(topologies)
        if dns_fp and dns_fp.confidence >= min_confidence:
            fingerprints.append(dns_fp)

        # Local Network Issues
        local_fp = self._detect_local_network_issues(topologies)
        if local_fp and local_fp.confidence >= min_confidence:
            fingerprints.append(local_fp)

        # ISP Backbone Issues
        backbone_fp = self._detect_backbone_issues(topologies)
        if backbone_fp and backbone_fp.confidence >= min_confidence:
            fingerprints.append(backbone_fp)

        # ISP Last-Mile Issues
        lastmile_fp = self._detect_lastmile_issues(measurements)
        if lastmile_fp and lastmile_fp.confidence >= min_confidence:
            fingerprints.append(lastmile_fp)

        # Time-Based Issues
        time_fp = self._detect_time_based_issues(measurements)
        if time_fp and time_fp.confidence >= min_confidence:
            fingerprints.append(time_fp)

        # Outage Pattern Issues
        outage_fp = self._detect_outage_pattern(outages)
        if outage_fp and outage_fp.confidence >= min_confidence:
            fingerprints.append(outage_fp)

        return fingerprints

    def _detect_dns_issues(
        self,
        topologies: list[NetworkTopology],
    ) -> ProblemFingerprint | None:
        """Detect DNS-related problems from early hop latency."""
        if not topologies:
            return None

        evidence = []
        confidence = 0.0
        high_latency_count = 0
        total_with_data = 0

        for topo in topologies:
            if topo.hops:
                early_hops = [h for h in topo.hops if h.hop_number <= 2 and h.latency_ms is not None]
                if early_hops:
                    total_with_data += 1
                    max_early = max(h.latency_ms for h in early_hops)
                    if max_early > 20:
                        high_latency_count += 1

        if total_with_data == 0:
            return None

        rate = high_latency_count / total_with_data

        if rate > 0.3:
            confidence = min(0.9, 0.3 + rate * 0.5)
            evidence.append(f"High first-hop latency in {high_latency_count}/{total_with_data} tests")
            evidence.append(f"Rate: {rate*100:.1f}% of tests affected")

            if confidence >= 0.5:
                return ProblemFingerprint(
                    category="dns",
                    severity="warning" if rate < 0.6 else "critical",
                    confidence=round(confidence, 2),
                    description="DNS or gateway latency issues detected",
                    evidence=evidence,
                    occurrence_count=high_latency_count,
                )

        return None

    def _detect_local_network_issues(
        self,
        topologies: list[NetworkTopology],
    ) -> ProblemFingerprint | None:
        """Detect local network problems."""
        if not topologies:
            return None

        evidence = []
        confidence = 0.0
        issues_count = sum(1 for t in topologies if not t.local_network_ok)
        total = len(topologies)

        if total == 0:
            return None

        rate = issues_count / total

        if rate > 0.1:
            confidence = min(0.95, 0.3 + rate * 0.6)
            evidence.append(f"Local network issues in {issues_count}/{total} topology scans")
            evidence.append(f"Issue rate: {rate*100:.1f}%")

            # Check for packet loss in local hops
            packet_loss_issues = 0
            for topo in topologies:
                if topo.hops:
                    local_hops = [h for h in topo.hops if h.is_local]
                    for hop in local_hops:
                        if hop.packet_loss_pct > 1:
                            packet_loss_issues += 1
                            break

            if packet_loss_issues > 0:
                evidence.append(f"Packet loss in local network detected in {packet_loss_issues} scans")
                confidence = min(0.95, confidence + 0.15)

            if confidence >= 0.5:
                return ProblemFingerprint(
                    category="local_network",
                    severity="critical" if rate > 0.5 else "warning",
                    confidence=round(confidence, 2),
                    description="Local network (router/switch) issues detected",
                    evidence=evidence,
                    occurrence_count=issues_count,
                )

        return None

    def _detect_backbone_issues(
        self,
        topologies: list[NetworkTopology],
    ) -> ProblemFingerprint | None:
        """Detect ISP backbone issues from middle hop latency."""
        if not topologies:
            return None

        evidence = []
        high_latency_count = 0
        total_with_data = 0
        backbone_latencies = []

        for topo in topologies:
            if topo.hops:
                mid_hops = [h for h in topo.hops if 4 <= h.hop_number <= 10 and h.latency_ms is not None]
                if mid_hops:
                    total_with_data += 1
                    max_mid = max(h.latency_ms for h in mid_hops)
                    backbone_latencies.append(max_mid)
                    if max_mid > 80:
                        high_latency_count += 1

        if total_with_data < 3:
            return None

        rate = high_latency_count / total_with_data
        avg_backbone = sum(backbone_latencies) / len(backbone_latencies) if backbone_latencies else 0

        if rate > 0.2 or avg_backbone > 60:
            confidence = min(0.85, 0.3 + rate * 0.4 + (avg_backbone / 200))
            evidence.append(f"High backbone latency in {high_latency_count}/{total_with_data} tests")
            evidence.append(f"Average backbone latency: {avg_backbone:.1f}ms")

            if confidence >= 0.5:
                return ProblemFingerprint(
                    category="isp_backbone",
                    severity="warning" if avg_backbone < 100 else "critical",
                    confidence=round(confidence, 2),
                    description="ISP backbone congestion or routing issues",
                    evidence=evidence,
                    occurrence_count=high_latency_count,
                )

        return None

    def _detect_lastmile_issues(
        self,
        measurements: list[Measurement],
    ) -> ProblemFingerprint | None:
        """Detect ISP last-mile issues from speed violations."""
        if len(measurements) < 5:
            return None

        evidence = []
        violations = [
            m for m in measurements
            if m.below_download_threshold or m.below_upload_threshold
        ]
        violation_rate = len(violations) / len(measurements)

        if violation_rate > 0.15:
            confidence = min(0.9, 0.3 + violation_rate * 0.8)
            evidence.append(f"Speed below threshold in {len(violations)}/{len(measurements)} tests ({violation_rate*100:.1f}%)")

            # Check for consistent patterns
            download_violations = sum(1 for m in violations if m.below_download_threshold)
            upload_violations = sum(1 for m in violations if m.below_upload_threshold)

            if download_violations > upload_violations * 2:
                evidence.append("Download speed more affected than upload")
            elif upload_violations > download_violations * 2:
                evidence.append("Upload speed more affected than download")

            if confidence >= 0.5:
                return ProblemFingerprint(
                    category="isp_lastmile",
                    severity="critical" if violation_rate > 0.4 else "warning",
                    confidence=round(confidence, 2),
                    description="ISP connection not meeting advertised speeds",
                    evidence=evidence,
                    occurrence_count=len(violations),
                )

        return None

    def _detect_time_based_issues(
        self,
        measurements: list[Measurement],
    ) -> ProblemFingerprint | None:
        """Detect time-based performance degradation."""
        if len(measurements) < 20:
            return None

        # Group by peak (18-23) vs off-peak hours
        peak_speeds = []
        offpeak_speeds = []

        for m in measurements:
            hour = m.timestamp.hour
            if 18 <= hour <= 23:
                peak_speeds.append(m.download_mbps)
            elif 2 <= hour <= 8:
                offpeak_speeds.append(m.download_mbps)

        if len(peak_speeds) < 5 or len(offpeak_speeds) < 5:
            return None

        avg_peak = sum(peak_speeds) / len(peak_speeds)
        avg_offpeak = sum(offpeak_speeds) / len(offpeak_speeds)

        if avg_offpeak > 0:
            degradation = (avg_offpeak - avg_peak) / avg_offpeak * 100

            if degradation > 15:
                confidence = min(0.85, 0.3 + (degradation / 100) * 1.5)
                evidence = [
                    f"Peak hours (18-23): {avg_peak:.1f} Mbps average",
                    f"Off-peak hours (2-8): {avg_offpeak:.1f} Mbps average",
                    f"Degradation: {degradation:.1f}%",
                ]

                if confidence >= 0.5:
                    return ProblemFingerprint(
                        category="time_based",
                        severity="warning" if degradation < 30 else "critical",
                        confidence=round(confidence, 2),
                        description="Significant speed reduction during peak hours",
                        evidence=evidence,
                    )

        return None

    def _detect_outage_pattern(
        self,
        outages: list[Outage],
    ) -> ProblemFingerprint | None:
        """Detect problematic outage patterns."""
        if len(outages) < 2:
            return None

        evidence = []
        total_duration = sum(o.duration_seconds or 0 for o in outages if o.ended_at)
        avg_duration = total_duration / len(outages) if outages else 0

        # Frequent outages
        if len(outages) >= 3:
            confidence = min(0.9, 0.4 + len(outages) * 0.1)
            evidence.append(f"{len(outages)} outages in analysis period")
            evidence.append(f"Total downtime: {total_duration/60:.1f} minutes")
            if avg_duration > 0:
                evidence.append(f"Average duration: {avg_duration/60:.1f} minutes")

            if confidence >= 0.5:
                return ProblemFingerprint(
                    category="outages",
                    severity="critical" if len(outages) >= 5 else "warning",
                    confidence=round(confidence, 2),
                    description="Frequent connectivity outages detected",
                    evidence=evidence,
                    occurrence_count=len(outages),
                )

        return None

    def _calculate_hop_correlations(
        self,
        measurements: list[Measurement],
        topologies: list[NetworkTopology],
    ) -> list[HopCorrelation]:
        """Calculate correlation between hop latency and download speed.

        Uses Pearson correlation to identify bottleneck hops.
        """
        if len(measurements) < 10 or len(topologies) < 5:
            return []

        # Match topologies with measurements (within 30 min window)
        hop_data: dict[int, dict] = defaultdict(lambda: {
            "latencies": [],
            "speeds": [],
            "ips": set(),
            "hostnames": set(),
            "packet_losses": [],
            "is_local": False,
        })

        for topo in topologies:
            # Find closest measurement
            closest_measurement = None
            min_diff = timedelta(minutes=30)

            for m in measurements:
                diff = abs(topo.timestamp - m.timestamp)
                if diff < min_diff:
                    min_diff = diff
                    closest_measurement = m

            if closest_measurement and topo.hops:
                for hop in topo.hops:
                    if hop.latency_ms is not None:
                        hop_data[hop.hop_number]["latencies"].append(hop.latency_ms)
                        hop_data[hop.hop_number]["speeds"].append(closest_measurement.download_mbps)
                        if hop.ip_address:
                            hop_data[hop.hop_number]["ips"].add(hop.ip_address)
                        if hop.hostname:
                            hop_data[hop.hop_number]["hostnames"].add(hop.hostname)
                        hop_data[hop.hop_number]["packet_losses"].append(hop.packet_loss_pct)
                        if hop.is_local:
                            hop_data[hop.hop_number]["is_local"] = True

        correlations = []
        for hop_num, data in sorted(hop_data.items()):
            if len(data["latencies"]) >= 5:
                latencies = data["latencies"]
                speeds = data["speeds"]

                # Calculate Pearson correlation
                corr = self._pearson_correlation(latencies, speeds)

                avg_latency = sum(latencies) / len(latencies)
                avg_loss = sum(data["packet_losses"]) / len(data["packet_losses"])

                # Determine if this is a bottleneck
                # Negative correlation means higher latency = lower speed
                is_bottleneck = corr < -0.4 or avg_loss > 2 or avg_latency > 80

                correlations.append(HopCorrelation(
                    hop_number=hop_num,
                    ip_address=list(data["ips"])[0] if data["ips"] else None,
                    hostname=list(data["hostnames"])[0] if data["hostnames"] else None,
                    avg_latency_ms=round(avg_latency, 2),
                    latency_correlation=round(corr, 3),
                    packet_loss_pct=round(avg_loss, 2),
                    is_bottleneck=is_bottleneck,
                    is_local=data["is_local"],
                ))

        return correlations

    def _detect_time_pattern(
        self,
        measurements: list[Measurement],
    ) -> TimePattern | None:
        """Detect time-based performance patterns."""
        if len(measurements) < 20:
            return None

        # Group by hour
        hourly: dict[int, list[float]] = defaultdict(list)
        for m in measurements:
            hourly[m.timestamp.hour].append(m.download_mbps)

        # Define peak hours (18-23)
        peak_hours = [18, 19, 20, 21, 22, 23]
        offpeak_hours = [2, 3, 4, 5, 6, 7, 8]

        peak_speeds = []
        offpeak_speeds = []

        for hour, speeds in hourly.items():
            if hour in peak_hours:
                peak_speeds.extend(speeds)
            elif hour in offpeak_hours:
                offpeak_speeds.extend(speeds)

        if len(peak_speeds) < 5 or len(offpeak_speeds) < 5:
            return None

        avg_peak = sum(peak_speeds) / len(peak_speeds)
        avg_offpeak = sum(offpeak_speeds) / len(offpeak_speeds)

        if avg_offpeak > 0:
            degradation = (avg_offpeak - avg_peak) / avg_offpeak * 100
            confidence = min(0.9, abs(degradation) / 50)

            if abs(degradation) > 10:
                return TimePattern(
                    pattern_type="peak_degradation" if degradation > 0 else "peak_improvement",
                    peak_hours=peak_hours,
                    peak_avg_download_mbps=round(avg_peak, 2),
                    offpeak_avg_download_mbps=round(avg_offpeak, 2),
                    degradation_pct=round(degradation, 1),
                    confidence=round(confidence, 2),
                )

        return None

    def _analyze_connection_impact(
        self,
        measurements: list[Measurement],
    ) -> ConnectionImpact | None:
        """Analyze impact of connection type on performance."""
        if len(measurements) < 10:
            return None

        # Group by connection type
        by_type: dict[str, list[float]] = defaultdict(list)
        for m in measurements:
            if m.connection_type and m.connection_type != "unknown":
                by_type[m.connection_type].append(m.download_mbps)

        if len(by_type) < 2:
            return None

        # Calculate averages
        type_avgs = {}
        for conn_type, speeds in by_type.items():
            if len(speeds) >= 3:
                type_avgs[conn_type] = sum(speeds) / len(speeds)

        if len(type_avgs) < 2:
            return None

        best = max(type_avgs.items(), key=lambda x: x[1])
        worst = min(type_avgs.items(), key=lambda x: x[1])

        gap = (best[1] - worst[1]) / best[1] * 100 if best[1] > 0 else 0

        # Determine if difference is significant
        has_significant_diff = gap > 20

        recommendation = ""
        if has_significant_diff:
            if worst[0] == "wifi":
                recommendation = "Consider using Ethernet for better performance"
            elif worst[0] == "ethernet":
                recommendation = "Check Ethernet cable or network adapter"
            else:
                recommendation = f"Performance varies significantly between connection types"
        else:
            recommendation = "Connection type has minimal impact on performance"

        return ConnectionImpact(
            has_significant_difference=has_significant_diff,
            best_connection=best[0],
            worst_connection=worst[0],
            download_gap_pct=round(gap, 1),
            recommendation=recommendation,
        )

    def _generate_recommendations(
        self,
        fingerprints: list[ProblemFingerprint],
        layer_scores: LayerScores,
        time_pattern: TimePattern | None,
        connection_impact: ConnectionImpact | None,
    ) -> list[Recommendation]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        priority = 1

        # Recommendations based on fingerprints
        for fp in fingerprints:
            if fp.category == "dns" and fp.confidence >= 0.5:
                recommendations.append(Recommendation(
                    priority=priority,
                    category="dns",
                    title="Optimize DNS Settings",
                    description="Consider using a faster DNS resolver like Cloudflare (1.1.1.1) or Google (8.8.8.8)",
                    expected_impact="Improved page load times and reduced latency",
                    difficulty="easy",
                ))
                priority += 1

            elif fp.category == "local_network" and fp.confidence >= 0.5:
                recommendations.append(Recommendation(
                    priority=priority,
                    category="local_network",
                    title="Check Local Network Equipment",
                    description="Restart router/modem, check for firmware updates, or consider upgrading older equipment",
                    expected_impact="Improved stability and reduced packet loss",
                    difficulty="easy",
                ))
                priority += 1

            elif fp.category == "isp_backbone" and fp.confidence >= 0.5:
                recommendations.append(Recommendation(
                    priority=priority,
                    category="isp",
                    title="Contact ISP About Routing",
                    description="Report consistent high latency in the network backbone to your ISP",
                    expected_impact="Better routing and reduced latency",
                    difficulty="moderate",
                ))
                priority += 1

            elif fp.category == "isp_lastmile" and fp.confidence >= 0.5:
                recommendations.append(Recommendation(
                    priority=priority,
                    category="isp",
                    title="Review ISP Service Level",
                    description="Your connection frequently falls below advertised speeds. Consider contacting ISP or reviewing your plan",
                    expected_impact="Consistent speeds meeting your plan's specifications",
                    difficulty="moderate",
                ))
                priority += 1

            elif fp.category == "time_based" and fp.confidence >= 0.5:
                recommendations.append(Recommendation(
                    priority=priority,
                    category="general",
                    title="Schedule Heavy Usage Off-Peak",
                    description="Performance degrades during peak hours. Schedule downloads and updates during off-peak times",
                    expected_impact="Better performance for bandwidth-heavy tasks",
                    difficulty="easy",
                ))
                priority += 1

            elif fp.category == "outages" and fp.confidence >= 0.5:
                recommendations.append(Recommendation(
                    priority=priority,
                    category="isp",
                    title="Document and Report Outages",
                    description="Keep a log of outages to discuss with ISP. Consider backup connectivity for critical needs",
                    expected_impact="Better service from ISP, potential service credits",
                    difficulty="moderate",
                ))
                priority += 1

        # Layer-based recommendations
        if layer_scores.local_network_score < 70:
            if not any(r.category == "local_network" for r in recommendations):
                recommendations.append(Recommendation(
                    priority=priority,
                    category="local_network",
                    title="Improve Local Network",
                    description="Local network health is below optimal. Check cables, restart equipment, or upgrade router",
                    expected_impact="More stable connection",
                    difficulty="easy",
                ))
                priority += 1

        # Connection type recommendation
        if connection_impact and connection_impact.has_significant_difference:
            recommendations.append(Recommendation(
                priority=priority,
                category="general",
                title=connection_impact.recommendation,
                description=f"Performance gap of {connection_impact.download_gap_pct:.0f}% between {connection_impact.best_connection} and {connection_impact.worst_connection}",
                expected_impact="More consistent performance",
                difficulty="easy" if "Ethernet" in connection_impact.recommendation else "moderate",
            ))
            priority += 1

        # If no issues found, add positive recommendation
        if not recommendations:
            recommendations.append(Recommendation(
                priority=1,
                category="general",
                title="Network Health is Good",
                description="No significant issues detected. Continue monitoring for changes",
                expected_impact="Maintained performance",
                difficulty="easy",
            ))

        return recommendations

    def _calculate_health_score(
        self,
        layer_scores: LayerScores,
        fingerprints: list[ProblemFingerprint],
    ) -> float:
        """Calculate overall network health score (0-100)."""
        # Weighted average of layer scores
        layer_avg = (
            layer_scores.dns_score * 0.15 +
            layer_scores.local_network_score * 0.25 +
            layer_scores.isp_backbone_score * 0.20 +
            layer_scores.isp_lastmile_score * 0.30 +
            layer_scores.server_score * 0.10
        )

        # Penalize for detected problems
        penalty = 0
        for fp in fingerprints:
            if fp.severity == "critical":
                penalty += 15 * fp.confidence
            elif fp.severity == "warning":
                penalty += 8 * fp.confidence
            else:
                penalty += 3 * fp.confidence

        score = max(0, min(100, layer_avg - penalty))
        return round(score, 1)

    @staticmethod
    def _coefficient_of_variation(values: list[float]) -> float:
        """Calculate coefficient of variation (std/mean)."""
        return coefficient_of_variation(values)

    @staticmethod
    def _pearson_correlation(x: list[float], y: list[float]) -> float:
        """Calculate Pearson correlation coefficient."""
        return pearson_correlation(x, y)


# Singleton instance
root_cause_service = RootCauseService()
