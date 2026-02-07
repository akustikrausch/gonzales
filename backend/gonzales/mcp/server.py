"""
MCP Server implementation for Gonzales.

This server exposes Gonzales functionality to MCP-compatible AI clients
like Claude Desktop.

Usage:
    gonzales-mcp  # Run the MCP server (stdio mode)
"""

import asyncio
import json
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

from gonzales.config import settings
from gonzales.version import __version__

# MCP protocol constants
JSONRPC_VERSION = "2.0"


class GonzalesMCPServer:
    """MCP Server for Gonzales speed test data."""

    def __init__(self):
        self.name = "gonzales"
        self.version = __version__

    def get_server_info(self) -> dict:
        """Return server information."""
        return {
            "name": self.name,
            "version": self.version,
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            }
        }

    def list_tools(self) -> list[dict]:
        """Return list of available tools."""
        return [
            {
                "name": "get_latest_speedtest",
                "description": "Get the most recent speed test result with download speed, upload speed, and ping latency.",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "run_speedtest",
                "description": "Trigger a new speed test and return the results. This may take 30-60 seconds to complete.",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "get_statistics",
                "description": "Get speed test statistics including averages, minimums, maximums, and reliability scores.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "days": {
                            "type": "integer",
                            "description": "Number of days to analyze (default: 7)",
                            "default": 7
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "get_connection_status",
                "description": "Check if the internet connection meets the configured speed thresholds.",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "get_outages",
                "description": "List detected network outages within a time period.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "days": {
                            "type": "integer",
                            "description": "Number of days to look back (default: 30)",
                            "default": 30
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "get_isp_score",
                "description": "Get the ISP quality score (A+ to F grade) based on speed, reliability, and consistency.",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "get_summary",
                "description": "Get a comprehensive summary of the internet connection status with alerts and recommendations.",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        ]

    async def call_tool(self, name: str, arguments: dict) -> dict:
        """Execute a tool and return the result."""
        try:
            if name == "get_latest_speedtest":
                return await self._get_latest_speedtest()
            elif name == "run_speedtest":
                return await self._run_speedtest()
            elif name == "get_statistics":
                days = arguments.get("days", 7)
                return await self._get_statistics(days)
            elif name == "get_connection_status":
                return await self._get_connection_status()
            elif name == "get_outages":
                days = arguments.get("days", 30)
                return await self._get_outages(days)
            elif name == "get_isp_score":
                return await self._get_isp_score()
            elif name == "get_summary":
                return await self._get_summary()
            else:
                return {"error": f"Unknown tool: {name}", "isError": True}
        except Exception as e:
            return {"error": str(e), "isError": True}

    async def _make_api_request(self, endpoint: str, method: str = "GET") -> dict:
        """Make a request to the Gonzales API."""
        import aiohttp

        url = f"http://localhost:{settings.port}/api/v1{endpoint}"
        timeout = aiohttp.ClientTimeout(total=120)

        headers = {}
        if settings.api_key:
            headers["X-API-Key"] = settings.api_key

        async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
            if method == "GET":
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return {"error": f"API returned {response.status}"}
            elif method == "POST":
                async with session.post(url) as response:
                    if response.status in (200, 202):
                        return await response.json()
                    else:
                        return {"error": f"API returned {response.status}"}
            else:
                return {"error": f"Unsupported HTTP method: {method}"}

    async def _get_latest_speedtest(self) -> dict:
        """Get the latest speed test result."""
        data = await self._make_api_request("/measurements/latest")
        if "error" in data:
            return data
        if data is None:
            return {"message": "No speed tests have been run yet."}

        return {
            "timestamp": data.get("timestamp"),
            "download_mbps": data.get("download_mbps"),
            "upload_mbps": data.get("upload_mbps"),
            "ping_ms": data.get("ping_latency_ms"),
            "server": data.get("server_name"),
            "message": f"Latest test: {data.get('download_mbps', 0):.1f} Mbps down, {data.get('upload_mbps', 0):.1f} Mbps up, {data.get('ping_latency_ms', 0):.0f}ms ping"
        }

    async def _run_speedtest(self) -> dict:
        """Trigger a new speed test and poll for results."""
        # Get the latest test timestamp before triggering so we can detect the new result
        before = await self._make_api_request("/measurements/latest")
        before_ts = before.get("timestamp") if isinstance(before, dict) and "error" not in before else None

        trigger = await self._make_api_request("/speedtest/trigger", method="POST")
        if "error" in trigger:
            return trigger

        # Poll for the new result (up to 90 seconds, checking every 5 seconds)
        max_attempts = 18
        for _ in range(max_attempts):
            await asyncio.sleep(5)
            data = await self._make_api_request("/measurements/latest")
            if isinstance(data, dict) and "error" not in data:
                current_ts = data.get("timestamp")
                if current_ts and current_ts != before_ts:
                    return {
                        "status": "completed",
                        "download_mbps": data.get("download_mbps"),
                        "upload_mbps": data.get("upload_mbps"),
                        "ping_ms": data.get("ping_latency_ms"),
                        "server": data.get("server_name"),
                        "message": f"Speed test completed: {data.get('download_mbps', 0):.1f} Mbps down, {data.get('upload_mbps', 0):.1f} Mbps up, {data.get('ping_latency_ms', 0):.0f}ms ping"
                    }

        return {
            "status": "started",
            "message": "Speed test was triggered but did not complete within 90 seconds. Use get_latest_speedtest to check for results later."
        }

    async def _get_statistics(self, days: int) -> dict:
        """Get statistics for the specified number of days."""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        endpoint = f"/statistics?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}"
        data = await self._make_api_request(endpoint)
        if "error" in data:
            return data

        download = data.get("download", {})
        upload = data.get("upload", {})
        ping = data.get("ping", {})

        return {
            "period_days": days,
            "total_tests": data.get("total_tests", 0),
            "download": {
                "avg": download.get("avg"),
                "min": download.get("min"),
                "max": download.get("max")
            },
            "upload": {
                "avg": upload.get("avg"),
                "min": upload.get("min"),
                "max": upload.get("max")
            },
            "ping": {
                "avg": ping.get("avg"),
                "min": ping.get("min"),
                "max": ping.get("max")
            },
            "message": f"Statistics for {days} days: Avg download {download.get('avg', 0):.1f} Mbps, avg upload {upload.get('avg', 0):.1f} Mbps, avg ping {ping.get('avg', 0):.0f}ms ({data.get('total_tests', 0)} tests)"
        }

    async def _get_connection_status(self) -> dict:
        """Check if connection meets thresholds."""
        data = await self._make_api_request("/summary")
        if "error" in data:
            return data

        status = data.get("status", "unknown")
        latest = data.get("latest_test", {})

        return {
            "status": status,
            "meets_threshold": latest.get("meets_threshold", False),
            "download_mbps": latest.get("download_mbps"),
            "upload_mbps": latest.get("upload_mbps"),
            "ping_ms": latest.get("ping_ms"),
            "threshold_download_mbps": settings.download_threshold_mbps,
            "threshold_upload_mbps": settings.upload_threshold_mbps,
            "message": data.get("summary", f"Connection status: {status}")
        }

    async def _get_outages(self, days: int) -> dict:
        """Get outages for the specified number of days."""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        endpoint = f"/outages?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}"
        data = await self._make_api_request(endpoint)
        if "error" in data:
            return data

        outages = data if isinstance(data, list) else []

        if not outages:
            return {
                "period_days": days,
                "outage_count": 0,
                "outages": [],
                "message": f"No outages detected in the last {days} days."
            }

        total_duration = sum(o.get("duration_minutes", 0) for o in outages)

        return {
            "period_days": days,
            "outage_count": len(outages),
            "total_duration_minutes": total_duration,
            "outages": [
                {
                    "start": o.get("start_time"),
                    "end": o.get("end_time"),
                    "duration_minutes": o.get("duration_minutes")
                }
                for o in outages[:10]  # Limit to 10 most recent
            ],
            "message": f"Found {len(outages)} outage(s) in the last {days} days, totaling {total_duration} minutes of downtime."
        }

    async def _get_isp_score(self) -> dict:
        """Get ISP quality score."""
        data = await self._make_api_request("/statistics/enhanced")
        if "error" in data:
            return data

        isp_score = data.get("isp_score")
        if not isp_score:
            return {
                "error": "Not enough data to calculate ISP score. Run more speed tests."
            }

        breakdown = isp_score.get("breakdown", {})

        return {
            "grade": isp_score.get("grade"),
            "composite_score": isp_score.get("composite"),
            "breakdown": {
                "speed": breakdown.get("speed_score"),
                "reliability": breakdown.get("reliability_score"),
                "latency": breakdown.get("latency_score"),
                "consistency": breakdown.get("consistency_score")
            },
            "message": f"ISP Grade: {isp_score.get('grade')} (Score: {isp_score.get('composite'):.0f}/100)"
        }

    async def _get_summary(self) -> dict:
        """Get comprehensive summary."""
        data = await self._make_api_request("/summary")
        if "error" in data:
            return data

        return {
            "status": data.get("status"),
            "summary": data.get("summary"),
            "latest_test": data.get("latest_test"),
            "statistics_7d": data.get("statistics_7d"),
            "alerts": data.get("alerts", []),
            "recommendations": data.get("recommendations", []),
            "message": data.get("summary", "Unable to get summary.")
        }


async def handle_request(server: GonzalesMCPServer, request: dict) -> dict:
    """Handle a single JSON-RPC request."""
    method = request.get("method")
    params = request.get("params", {})
    request_id = request.get("id")

    if method == "initialize":
        result = server.get_server_info()
    elif method == "tools/list":
        result = {"tools": server.list_tools()}
    elif method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})
        tool_result = await server.call_tool(tool_name, tool_args)
        is_error = tool_result.get("isError", False) if isinstance(tool_result, dict) else False
        result = {
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(tool_result, indent=2)
                }
            ],
            "isError": is_error
        }
    elif method == "notifications/initialized":
        # Client is ready, no response needed
        return None
    else:
        return {
            "jsonrpc": JSONRPC_VERSION,
            "id": request_id,
            "error": {
                "code": -32601,
                "message": f"Method not found: {method}"
            }
        }

    return {
        "jsonrpc": JSONRPC_VERSION,
        "id": request_id,
        "result": result
    }


async def run_server():
    """Run the MCP server in stdio mode."""
    server = GonzalesMCPServer()

    # Read from stdin, write to stdout
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await asyncio.get_event_loop().connect_read_pipe(lambda: protocol, sys.stdin)

    writer_transport, writer_protocol = await asyncio.get_event_loop().connect_write_pipe(
        asyncio.streams.FlowControlMixin, sys.stdout
    )
    writer = asyncio.StreamWriter(writer_transport, writer_protocol, reader, asyncio.get_event_loop())

    while True:
        try:
            # Read content-length header
            header_line = await reader.readline()
            if not header_line:
                break

            header = header_line.decode().strip()
            if not header.startswith("Content-Length:"):
                continue

            content_length = int(header.split(":")[1].strip())

            # Skip empty line
            await reader.readline()

            # Read content
            content = await reader.read(content_length)
            request = json.loads(content.decode())

            # Handle request
            response = await handle_request(server, request)

            if response:
                response_json = json.dumps(response)
                response_bytes = response_json.encode()
                header = f"Content-Length: {len(response_bytes)}\r\n\r\n"
                writer.write(header.encode() + response_bytes)
                await writer.drain()

        except Exception as e:
            # Log error but continue
            sys.stderr.write(f"MCP Error: {e}\n")
            sys.stderr.flush()


def main():
    """Entry point for gonzales-mcp command."""
    try:
        asyncio.run(run_server())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
