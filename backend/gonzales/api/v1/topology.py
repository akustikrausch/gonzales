"""Network topology analysis API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.schemas.topology import (
    NetworkDiagnosisOut,
    NetworkTopologyOut,
    TopologyHistoryOut,
)
from gonzales.services.topology_service import topology_service

router = APIRouter(prefix="/topology", tags=["topology"])


@router.post("/analyze", response_model=NetworkTopologyOut)
async def analyze_topology(
    target: str | None = Query(default=None, description="Target host (default: 1.1.1.1)"),
    session: AsyncSession = Depends(get_db),
):
    """Run a traceroute analysis to the specified target."""
    topology = await topology_service.analyze(session, target)
    return _topology_to_out(topology)


@router.get("/latest", response_model=NetworkTopologyOut | None)
async def get_latest_topology(session: AsyncSession = Depends(get_db)):
    """Get the most recent topology analysis."""
    topology = await topology_service.get_latest(session)
    if topology is None:
        return None
    return _topology_to_out(topology)


@router.get("/history", response_model=TopologyHistoryOut)
async def get_topology_history(
    limit: int = Query(default=10, ge=1, le=50),
    session: AsyncSession = Depends(get_db),
):
    """Get recent topology analyses."""
    analyses = await topology_service.get_history(session, limit)
    return TopologyHistoryOut(
        entries=[
            {
                "id": a.id,
                "timestamp": a.timestamp,
                "target_host": a.target_host,
                "total_hops": a.total_hops,
                "total_latency_ms": a.total_latency_ms,
                "local_network_ok": a.local_network_ok,
            }
            for a in analyses
        ],
        total=len(analyses),
    )


@router.get("/diagnosis", response_model=NetworkDiagnosisOut)
async def get_network_diagnosis(
    limit: int = Query(default=10, ge=1, le=50),
    session: AsyncSession = Depends(get_db),
):
    """Get aggregated network diagnosis based on recent analyses."""
    diagnosis = await topology_service.get_diagnosis(session, limit)
    return NetworkDiagnosisOut(**diagnosis)


@router.get("/{topology_id}", response_model=NetworkTopologyOut)
async def get_topology(
    topology_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Get a specific topology analysis by ID."""
    topology = await topology_service.get_by_id(session, topology_id)
    if topology is None:
        raise HTTPException(status_code=404, detail="Topology analysis not found")
    return _topology_to_out(topology)


def _get_hop_status(hop) -> str:
    """Determine status for a hop."""
    if hop.is_timeout:
        return "timeout"
    if hop.packet_loss_pct > 5:
        return "packet_loss"
    if hop.latency_ms is not None and hop.latency_ms > 50:
        return "high_latency"
    return "ok"


def _topology_to_out(topology) -> NetworkTopologyOut:
    """Convert a NetworkTopology model to output schema."""
    hops = [
        {
            "hop_number": h.hop_number,
            "ip_address": h.ip_address,
            "hostname": h.hostname,
            "latency_ms": h.latency_ms,
            "packet_loss_pct": h.packet_loss_pct,
            "is_local": h.is_local,
            "is_timeout": h.is_timeout,
            "status": _get_hop_status(h),
        }
        for h in sorted(topology.hops, key=lambda x: x.hop_number)
    ]

    # Find bottleneck hop
    bottleneck_hop = None
    valid_hops = [h for h in topology.hops if h.latency_ms is not None]
    if valid_hops:
        max_hop = max(valid_hops, key=lambda x: x.latency_ms or 0)
        if max_hop.latency_ms and max_hop.latency_ms > 20:
            bottleneck_hop = max_hop.hop_number

    return NetworkTopologyOut(
        id=topology.id,
        timestamp=topology.timestamp,
        target_host=topology.target_host,
        total_hops=topology.total_hops,
        total_latency_ms=topology.total_latency_ms,
        hops=hops,
        bottleneck_hop=bottleneck_hop,
        local_network_ok=topology.local_network_ok,
        diagnosis=topology.diagnosis,
    )
