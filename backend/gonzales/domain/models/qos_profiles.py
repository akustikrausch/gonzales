"""QoS Profile definitions for application-specific network quality tests."""
from dataclasses import dataclass
from typing import TypedDict


class QosProfileDict(TypedDict, total=False):
    """Type definition for QoS profile configuration."""

    name: str
    min_download_mbps: float
    min_upload_mbps: float
    max_ping_ms: float
    max_jitter_ms: float
    max_packet_loss_pct: float
    icon: str
    description: str


@dataclass(frozen=True)
class QosProfile:
    """Immutable QoS profile with requirements for specific applications."""

    id: str
    name: str
    icon: str
    description: str
    min_download_mbps: float | None = None
    min_upload_mbps: float | None = None
    max_ping_ms: float | None = None
    max_jitter_ms: float | None = None
    max_packet_loss_pct: float | None = None

    @classmethod
    def from_dict(cls, profile_id: str, data: QosProfileDict) -> "QosProfile":
        """Create a QosProfile from a dictionary."""
        return cls(
            id=profile_id,
            name=data.get("name", profile_id),
            icon=data.get("icon", "activity"),
            description=data.get("description", ""),
            min_download_mbps=data.get("min_download_mbps"),
            min_upload_mbps=data.get("min_upload_mbps"),
            max_ping_ms=data.get("max_ping_ms"),
            max_jitter_ms=data.get("max_jitter_ms"),
            max_packet_loss_pct=data.get("max_packet_loss_pct"),
        )


# QoS Profile definitions based on official application requirements
QOS_PROFILES: dict[str, QosProfileDict] = {
    "netflix_4k": {
        "name": "Netflix 4K Streaming",
        "min_download_mbps": 25.0,
        "max_ping_ms": 100.0,
        "max_jitter_ms": 30.0,
        "max_packet_loss_pct": 0.5,
        "icon": "tv",
        "description": "Ultra HD streaming requires stable high bandwidth",
    },
    "youtube_4k": {
        "name": "YouTube 4K",
        "min_download_mbps": 20.0,
        "max_ping_ms": 150.0,
        "max_jitter_ms": 50.0,
        "max_packet_loss_pct": 1.0,
        "icon": "play-circle",
        "description": "4K video playback with adaptive bitrate",
    },
    "zoom_hd": {
        "name": "Zoom HD Video Call",
        "min_download_mbps": 3.0,
        "min_upload_mbps": 3.0,
        "max_ping_ms": 150.0,
        "max_jitter_ms": 40.0,
        "max_packet_loss_pct": 1.0,
        "icon": "video",
        "description": "HD video conferencing with screen sharing",
    },
    "teams_call": {
        "name": "Microsoft Teams",
        "min_download_mbps": 4.0,
        "min_upload_mbps": 4.0,
        "max_ping_ms": 100.0,
        "max_jitter_ms": 30.0,
        "max_packet_loss_pct": 1.0,
        "icon": "users",
        "description": "Group video calls and collaboration",
    },
    "cloud_gaming": {
        "name": "Cloud Gaming",
        "min_download_mbps": 35.0,
        "max_ping_ms": 40.0,
        "max_jitter_ms": 10.0,
        "max_packet_loss_pct": 0.1,
        "icon": "gamepad-2",
        "description": "GeForce NOW, Xbox Cloud, PS Remote Play",
    },
    "online_gaming": {
        "name": "Online Gaming",
        "min_download_mbps": 10.0,
        "min_upload_mbps": 5.0,
        "max_ping_ms": 50.0,
        "max_jitter_ms": 15.0,
        "max_packet_loss_pct": 0.5,
        "icon": "swords",
        "description": "Competitive multiplayer gaming",
    },
    "vpn_work": {
        "name": "VPN Remote Work",
        "min_download_mbps": 10.0,
        "min_upload_mbps": 5.0,
        "max_ping_ms": 100.0,
        "max_jitter_ms": 50.0,
        "icon": "briefcase",
        "description": "Remote desktop, file sharing, VoIP",
    },
    "video_upload": {
        "name": "Video Upload",
        "min_upload_mbps": 20.0,
        "max_ping_ms": 200.0,
        "icon": "upload",
        "description": "YouTube, TikTok, Instagram content creation",
    },
    "live_streaming": {
        "name": "Live Streaming",
        "min_upload_mbps": 15.0,
        "max_ping_ms": 100.0,
        "max_jitter_ms": 20.0,
        "max_packet_loss_pct": 0.5,
        "icon": "radio",
        "description": "Twitch, YouTube Live, OBS streaming",
    },
    "smart_home": {
        "name": "Smart Home",
        "min_download_mbps": 5.0,
        "min_upload_mbps": 2.0,
        "max_ping_ms": 200.0,
        "icon": "home",
        "description": "IoT devices, cameras, voice assistants",
    },
}


def get_profile(profile_id: str) -> QosProfile | None:
    """Get a QoS profile by ID."""
    if profile_id not in QOS_PROFILES:
        return None
    return QosProfile.from_dict(profile_id, QOS_PROFILES[profile_id])


def get_all_profiles() -> list[QosProfile]:
    """Get all available QoS profiles."""
    return [QosProfile.from_dict(pid, data) for pid, data in QOS_PROFILES.items()]
