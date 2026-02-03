"""Network analyzer implementation using icmplib."""
import socket
from datetime import datetime, timezone

from gonzales.core.logging import logger
from gonzales.domain.ports.network_analyzer_port import (
    HopResult,
    NetworkAnalyzerPort,
    TopologyResult,
)

# Import icmplib - may fail on systems without raw socket permissions
try:
    from icmplib import async_traceroute, async_ping
    ICMPLIB_AVAILABLE = True
except ImportError:
    ICMPLIB_AVAILABLE = False
    logger.warning("icmplib not available - traceroute features disabled")


def _is_local_network(ip: str | None) -> bool:
    """Check if an IP address is in a private/local network range."""
    if not ip:
        return False
    return ip.startswith((
        "192.168.",
        "10.",
        "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.",
        "172.24.", "172.25.", "172.26.", "172.27.",
        "172.28.", "172.29.", "172.30.", "172.31.",
        "127.",
        "169.254.",
    ))


def _resolve_hostname(ip: str | None) -> str | None:
    """Attempt reverse DNS lookup for an IP address."""
    if not ip:
        return None
    try:
        hostname, _, _ = socket.gethostbyaddr(ip)
        return hostname
    except (socket.herror, socket.gaierror, OSError):
        return None


class IcmplibNetworkAnalyzer(NetworkAnalyzerPort):
    """Network analyzer implementation using icmplib library."""

    async def analyze_route(self, target: str, max_hops: int = 30) -> TopologyResult:
        """Perform traceroute analysis to the target host."""
        timestamp = datetime.now(timezone.utc)

        if not ICMPLIB_AVAILABLE:
            return TopologyResult(
                target_host=target,
                timestamp=timestamp,
                hops=[],
                completed=False,
                error_message="icmplib not available - install with pip install icmplib",
            )

        try:
            # Run traceroute
            hops_data = await async_traceroute(
                target,
                count=3,
                interval=0.1,
                timeout=2,
                max_hops=max_hops,
            )

            hops: list[HopResult] = []
            for hop in hops_data:
                is_timeout = hop.address is None
                ip = hop.address if not is_timeout else None
                hostname = _resolve_hostname(ip) if ip else None

                hops.append(HopResult(
                    hop_number=hop.distance,
                    ip_address=ip,
                    hostname=hostname,
                    latency_ms=hop.avg_rtt if not is_timeout else None,
                    packet_loss_pct=hop.packet_loss * 100 if hasattr(hop, "packet_loss") else 0.0,
                    is_timeout=is_timeout,
                ))

            return TopologyResult(
                target_host=target,
                timestamp=timestamp,
                hops=hops,
                completed=True,
            )

        except PermissionError:
            logger.error("Permission denied for raw sockets - traceroute requires root/sudo")
            return TopologyResult(
                target_host=target,
                timestamp=timestamp,
                hops=[],
                completed=False,
                error_message="Permission denied - traceroute requires elevated privileges",
            )
        except Exception as e:
            logger.error("Traceroute failed: %s", str(e))
            return TopologyResult(
                target_host=target,
                timestamp=timestamp,
                hops=[],
                completed=False,
                error_message=str(e),
            )

    async def ping(self, target: str, count: int = 3) -> tuple[float | None, float]:
        """Ping the target and return average latency and packet loss."""
        if not ICMPLIB_AVAILABLE:
            return None, 100.0

        try:
            result = await async_ping(target, count=count, interval=0.2, timeout=2)
            if result.is_alive:
                return result.avg_rtt, result.packet_loss * 100
            return None, 100.0
        except PermissionError:
            logger.error("Permission denied for ping")
            return None, 100.0
        except Exception as e:
            logger.error("Ping failed: %s", str(e))
            return None, 100.0


# Singleton instance
network_analyzer = IcmplibNetworkAnalyzer()
