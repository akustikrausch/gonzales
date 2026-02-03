"""Network topology analysis service."""
from datetime import datetime, timezone

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from gonzales.db.models import NetworkHop, NetworkTopology
from gonzales.domain.ports.network_analyzer_port import TopologyResult
from gonzales.infrastructure.adapters.icmplib_analyzer import network_analyzer


class TopologyService:
    """Service for network topology analysis."""

    # Default target for traceroute (Cloudflare DNS)
    DEFAULT_TARGET = "1.1.1.1"

    async def analyze(
        self,
        session: AsyncSession,
        target: str | None = None,
        measurement_id: int | None = None,
    ) -> NetworkTopology:
        """Run a traceroute analysis and store the result."""
        target = target or self.DEFAULT_TARGET

        # Run traceroute
        result = await network_analyzer.analyze_route(target)

        # Convert to database model
        topology = self._result_to_model(result, measurement_id)

        # Save to database
        session.add(topology)
        await session.commit()
        await session.refresh(topology)

        # Load hops relationship
        await session.execute(
            select(NetworkTopology)
            .options(selectinload(NetworkTopology.hops))
            .where(NetworkTopology.id == topology.id)
        )

        return topology

    def _result_to_model(
        self,
        result: TopologyResult,
        measurement_id: int | None = None,
    ) -> NetworkTopology:
        """Convert a TopologyResult to database models."""
        # Determine if local network is healthy
        local_ok = True
        for hop in result.hops:
            if hop.is_local_network:
                if hop.latency_ms is not None and hop.latency_ms > 10:
                    local_ok = False
                if hop.packet_loss_pct > 1:
                    local_ok = False

        topology = NetworkTopology(
            timestamp=result.timestamp,
            target_host=result.target_host,
            total_hops=result.total_hops,
            total_latency_ms=result.total_latency_ms,
            completed=result.completed,
            error_message=result.error_message,
            local_network_ok=local_ok,
            diagnosis=result.get_diagnosis(),
            measurement_id=measurement_id,
        )

        # Create hop models
        for hop in result.hops:
            hop_model = NetworkHop(
                hop_number=hop.hop_number,
                ip_address=hop.ip_address,
                hostname=hop.hostname,
                latency_ms=hop.latency_ms,
                packet_loss_pct=hop.packet_loss_pct,
                is_local=hop.is_local_network,
                is_timeout=hop.is_timeout,
            )
            topology.hops.append(hop_model)

        return topology

    async def get_latest(self, session: AsyncSession) -> NetworkTopology | None:
        """Get the most recent topology analysis."""
        result = await session.execute(
            select(NetworkTopology)
            .options(selectinload(NetworkTopology.hops))
            .order_by(desc(NetworkTopology.timestamp))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, session: AsyncSession, topology_id: int) -> NetworkTopology | None:
        """Get a topology analysis by ID."""
        result = await session.execute(
            select(NetworkTopology)
            .options(selectinload(NetworkTopology.hops))
            .where(NetworkTopology.id == topology_id)
        )
        return result.scalar_one_or_none()

    async def get_history(
        self,
        session: AsyncSession,
        limit: int = 10,
    ) -> list[NetworkTopology]:
        """Get recent topology analyses."""
        result = await session.execute(
            select(NetworkTopology)
            .options(selectinload(NetworkTopology.hops))
            .order_by(desc(NetworkTopology.timestamp))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_diagnosis(self, session: AsyncSession, limit: int = 10) -> dict:
        """Get aggregated network diagnosis based on recent analyses."""
        analyses = await self.get_history(session, limit)

        if not analyses:
            return {
                "total_analyses": 0,
                "local_network_issues": 0,
                "local_network_health_pct": 100.0,
                "avg_total_hops": 0.0,
                "avg_total_latency_ms": 0.0,
                "common_bottleneck_hops": [],
                "overall_status": "unknown",
                "recommendations": ["Run a network analysis to get diagnostics"],
            }

        total = len(analyses)
        local_issues = sum(1 for a in analyses if not a.local_network_ok)
        local_health_pct = ((total - local_issues) / total) * 100

        avg_hops = sum(a.total_hops for a in analyses) / total
        avg_latency = sum(a.total_latency_ms for a in analyses) / total

        # Find common bottleneck hops (hops with high latency)
        bottleneck_counts: dict[int, int] = {}
        for analysis in analyses:
            if analysis.hops:
                # Find hop with max latency
                valid_hops = [h for h in analysis.hops if h.latency_ms is not None]
                if valid_hops:
                    max_hop = max(valid_hops, key=lambda h: h.latency_ms or 0)
                    if max_hop.latency_ms and max_hop.latency_ms > 20:
                        hop_num = max_hop.hop_number
                        bottleneck_counts[hop_num] = bottleneck_counts.get(hop_num, 0) + 1

        common_bottlenecks = sorted(
            bottleneck_counts.keys(),
            key=lambda h: bottleneck_counts[h],
            reverse=True,
        )[:3]

        # Determine overall status
        if local_health_pct >= 90 and avg_latency < 100:
            status = "healthy"
        elif local_health_pct >= 70 or avg_latency < 200:
            status = "degraded"
        else:
            status = "problematic"

        # Generate recommendations
        recommendations = []
        if local_health_pct < 90:
            recommendations.append("Check your local network equipment (router, switch)")
        if avg_latency > 150:
            recommendations.append("High overall latency detected - consider ISP contact")
        if common_bottlenecks:
            recommendations.append(f"Consistent bottleneck at hop(s): {common_bottlenecks}")
        if not recommendations:
            recommendations.append("Network path looks healthy")

        return {
            "total_analyses": total,
            "local_network_issues": local_issues,
            "local_network_health_pct": round(local_health_pct, 1),
            "avg_total_hops": round(avg_hops, 1),
            "avg_total_latency_ms": round(avg_latency, 1),
            "common_bottleneck_hops": common_bottlenecks,
            "overall_status": status,
            "recommendations": recommendations,
        }

    async def delete_all(self, session: AsyncSession) -> int:
        """Delete all topology analyses."""
        result = await session.execute(delete(NetworkTopology))
        await session.commit()
        return result.rowcount


# Singleton instance
topology_service = TopologyService()
