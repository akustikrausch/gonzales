"""Connection type detection based on network interface patterns.

Detects whether a network connection is Ethernet, WiFi, VPN, or Unknown
based on interface naming conventions across different operating systems.
"""

import re
from enum import Enum


class ConnectionType(str, Enum):
    """Network connection type classification."""

    ETHERNET = "ethernet"
    WIFI = "wifi"
    VPN = "vpn"
    UNKNOWN = "unknown"


# Interface name patterns by connection type
# These patterns cover Linux, macOS, and Windows naming conventions

ETHERNET_PATTERNS = [
    r"^eth\d+$",  # Linux classic: eth0, eth1
    r"^enp\d+s\d+.*$",  # Linux systemd predictable: enp0s3, enp3s0f0
    r"^eno\d+$",  # Linux onboard: eno1, eno2
    r"^ens\d+$",  # Linux slot: ens192
    r"^em\d+$",  # RHEL/CentOS embedded: em1
    r"^p\d+p\d+$",  # Linux PCI slot: p1p1
    r"^Ethernet.*$",  # Windows: Ethernet, Ethernet 2
    r"^Local Area Connection.*$",  # Windows legacy
    r"^veth[a-f0-9]+$",  # Docker veth (virtual ethernet)
    r"^br-[a-f0-9]+$",  # Docker bridge
    r"^docker\d*$",  # Docker default
    r"^virbr\d+$",  # libvirt bridge
]

WIFI_PATTERNS = [
    r"^wlan\d+$",  # Linux classic: wlan0
    r"^wlp\d+s\d+.*$",  # Linux systemd: wlp2s0, wlp3s0f0
    r"^wlx[a-f0-9]+$",  # Linux USB WiFi: wlx00c0ca123456
    r"^Wi-?Fi.*$",  # Windows: Wi-Fi, WiFi
    r"^Wireless.*$",  # Windows: Wireless Network Connection
    r"^wl\d+$",  # Generic wireless
    r"^ath\d+$",  # Atheros wireless
    r"^ra\d+$",  # Ralink wireless
]

VPN_PATTERNS = [
    r"^tun\d+$",  # TUN devices: tun0
    r"^tap\d+$",  # TAP devices: tap0
    r"^ppp\d+$",  # PPP connections: ppp0
    r"^wg\d+$",  # WireGuard: wg0
    r"^wg-.*$",  # WireGuard named
    r"^nordlynx.*$",  # NordVPN
    r"^proton.*$",  # ProtonVPN
    r"^mullvad.*$",  # Mullvad VPN
    r"^tailscale\d*$",  # Tailscale
    r"^utun\d+$",  # macOS userspace tunnel
    r"^ipsec\d+$",  # IPsec
    r"^vpn\d*$",  # Generic VPN
    r"^gpd\d+$",  # GlobalProtect
    r"^cscotun\d+$",  # Cisco AnyConnect
]


def _matches_any_pattern(interface_name: str, patterns: list[str]) -> bool:
    """Check if interface name matches any of the given patterns."""
    for pattern in patterns:
        if re.match(pattern, interface_name, re.IGNORECASE):
            return True
    return False


def detect_connection_type(
    interface_name: str,
    is_vpn: bool = False,
    mac_address: str = "",
) -> ConnectionType:
    """Detect connection type based on interface name and VPN flag.

    Priority:
    1. is_vpn flag from speedtest CLI (authoritative for VPN)
    2. VPN interface name patterns
    3. WiFi interface name patterns
    4. Ethernet interface name patterns
    5. Default to UNKNOWN

    Args:
        interface_name: Network interface name (e.g., "eth0", "wlan0")
        is_vpn: VPN flag from speedtest CLI result
        mac_address: MAC address (reserved for future OUI-based detection)

    Returns:
        ConnectionType enum value
    """
    if not interface_name:
        return ConnectionType.UNKNOWN

    # VPN flag from speedtest CLI is authoritative
    if is_vpn:
        return ConnectionType.VPN

    # Check VPN patterns (tunnel interfaces may not have is_vpn=True)
    if _matches_any_pattern(interface_name, VPN_PATTERNS):
        return ConnectionType.VPN

    # Check WiFi patterns
    if _matches_any_pattern(interface_name, WIFI_PATTERNS):
        return ConnectionType.WIFI

    # Check Ethernet patterns
    if _matches_any_pattern(interface_name, ETHERNET_PATTERNS):
        return ConnectionType.ETHERNET

    # macOS uses en0/en1 which can be either Ethernet or WiFi
    # Without additional info, we can't distinguish, default to UNKNOWN
    if re.match(r"^en\d+$", interface_name):
        # Could use MAC OUI lookup in future to distinguish
        # For now, mark as unknown since it's ambiguous
        return ConnectionType.UNKNOWN

    return ConnectionType.UNKNOWN


def get_connection_type_display(conn_type: ConnectionType) -> str:
    """Get human-readable display name for connection type."""
    display_names = {
        ConnectionType.ETHERNET: "Ethernet",
        ConnectionType.WIFI: "WiFi",
        ConnectionType.VPN: "VPN",
        ConnectionType.UNKNOWN: "Unknown",
    }
    return display_names.get(conn_type, "Unknown")
