"""Network topology analysis API endpoints."""
import ipaddress

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.core.rate_limit import limiter
from gonzales.schemas.topology import (
    NetworkDiagnosisOut,
    NetworkTopologyOut,
    TopologyHistoryOut,
)
from gonzales.services.topology_service import topology_service

router = APIRouter(prefix="/topology", tags=["topology"])

# Allowlisted public DNS servers for topology analysis
ALLOWED_TARGETS = frozenset({
    "1.1.1.1",        # Cloudflare
    "8.8.8.8",        # Google
    "8.8.4.4",        # Google
    "208.67.222.222", # OpenDNS
    "208.67.220.220", # OpenDNS
    "9.9.9.9",        # Quad9
    "149.112.112.112",# Quad9
})


def _validate_target(target: str | None) -> str:
    """Validate and sanitize the target IP address.

    Args:
        target: IP address to validate, or None for default.

    Returns:
        Validated IP address string.

    Raises:
        HTTPException: If the target is invalid or not allowed.
    """
    if target is None:
        return "1.1.1.1"

    # Check against allowlist first (fast path)
    if target in ALLOWED_TARGETS:
        return target

    # Validate IP format and check for private/loopback
    try:
        ip = ipaddress.ip_address(target)
        if ip.is_private:
            raise HTTPException(
                status_code=400,
                detail="Private IP addresses are not allowed for security reasons"
            )
        if ip.is_loopback:
            raise HTTPException(
                status_code=400,
                detail="Loopback addresses are not allowed"
            )
        if ip.is_multicast:
            raise HTTPException(
                status_code=400,
                detail="Multicast addresses are not allowed"
            )
        if ip.is_reserved:
            raise HTTPException(
                status_code=400,
                detail="Reserved addresses are not allowed"
            )
        return str(ip)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid IP address format. Use IPv4 or IPv6 address."
        )


@router.post("/analyze", response_model=NetworkTopologyOut)
@limiter.limit("5/minute")
async def analyze_topology(
    request: Request,
    target: str | None = Query(default=None, description="Target host (default: 1.1.1.1)"),
    session: AsyncSession = Depends(get_db),
):
    """Run a traceroute analysis to the specified target.

    Only public IP addresses are allowed to prevent SSRF attacks.
    Common DNS servers (1.1.1.1, 8.8.8.8, etc.) are pre-approved.
    """
    validated_target = _validate_target(target)
    topology = await topology_service.analyze(session, validated_target)
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
