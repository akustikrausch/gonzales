import asyncio
import json
import shutil

from gonzales.config import settings
from gonzales.core.exceptions import (
    SpeedtestBinaryNotFoundError,
    SpeedtestError,
    SpeedtestTimeoutError,
)
from gonzales.core.logging import logger
from gonzales.schemas.speedtest_raw import SpeedtestRawResult
from gonzales.services.event_bus import event_bus


class SpeedtestRunner:
    TIMEOUT_SECONDS = 120

    def __init__(self) -> None:
        self._binary_path: str | None = None

    def validate_binary(self) -> str:
        path = shutil.which(settings.speedtest_binary)
        if path is None:
            raise SpeedtestBinaryNotFoundError(
                f"Speedtest binary '{settings.speedtest_binary}' not found in PATH. "
                "Install from https://www.speedtest.net/apps/cli"
            )
        self._binary_path = path
        logger.info("Speedtest binary found: %s", path)
        return path

    @property
    def binary_path(self) -> str:
        if self._binary_path is None:
            return self.validate_binary()
        return self._binary_path

    async def run(self, server_id: int = 0) -> SpeedtestRawResult:
        logger.info("Starting speed test...")
        cmd = [self.binary_path, "--format=json", "--accept-license", "--accept-gdpr"]
        if server_id > 0:
            cmd.extend(["--server-id", str(server_id)])

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=self.TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            raise SpeedtestTimeoutError(
                f"Speedtest timed out after {self.TIMEOUT_SECONDS}s"
            )
        except FileNotFoundError:
            raise SpeedtestBinaryNotFoundError(
                f"Speedtest binary not found at: {self.binary_path}"
            )

        stdout_text = stdout.decode("utf-8", errors="replace").strip()
        stderr_text = stderr.decode("utf-8", errors="replace").strip()

        if process.returncode != 0:
            raise SpeedtestError(
                f"Speedtest exited with code {process.returncode}: {stderr_text}",
                raw_output=stdout_text or stderr_text,
            )

        try:
            data = json.loads(stdout_text)
        except json.JSONDecodeError as e:
            raise SpeedtestError(
                f"Failed to parse speedtest JSON output: {e}",
                raw_output=stdout_text,
            )

        result = SpeedtestRawResult.model_validate(data)
        logger.info(
            "Speed test complete: down %.1f Mbps, up %.1f Mbps, ping %.1f ms",
            result.download_mbps,
            result.upload_mbps,
            result.ping.latency,
        )
        return result

    async def run_with_progress(self, server_id: int = 0) -> SpeedtestRawResult:
        logger.info("Starting speed test with progress...")
        cmd = [
            self.binary_path,
            "--format=json",
            "--progress=yes",
            "--accept-license",
            "--accept-gdpr",
        ]
        if server_id > 0:
            cmd.extend(["--server-id", str(server_id)])

        event_bus.publish({"event": "started", "data": {"phase": "started"}})

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            final_result = None
            buffer = ""
            prev_phase = ""

            async def read_stdout():
                nonlocal final_result, buffer
                while True:
                    chunk = await process.stdout.read(4096)
                    if not chunk:
                        break
                    buffer += chunk.decode("utf-8", errors="replace")
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        msg_type = data.get("type", "")
                        if msg_type == "testStart":
                            logger.info("Phase: Ping")
                            event_bus.publish({
                                "event": "progress",
                                "data": {"phase": "ping", "progress": 0},
                            })
                        elif msg_type == "ping":
                            ping_ms = data.get("ping", {}).get("latency", 0)
                            ping_progress = data.get("ping", {}).get("progress", 0)
                            if ping_progress >= 1:
                                logger.info("Ping: %.1f ms", ping_ms)
                            event_bus.publish({
                                "event": "progress",
                                "data": {
                                    "phase": "ping",
                                    "ping_ms": ping_ms,
                                    "progress": ping_progress,
                                },
                            })
                        elif msg_type == "download":
                            bw = data.get("download", {}).get("bandwidth", 0)
                            bw_mbps = round(bw * 8 / 1_000_000, 2)
                            dl_progress = data.get("download", {}).get("progress", 0)
                            dl_elapsed = data.get("download", {}).get("elapsed", 0)
                            if prev_phase != "download":
                                logger.info("Phase: Download")
                                prev_phase = "download"
                            event_bus.publish({
                                "event": "progress",
                                "data": {
                                    "phase": "download",
                                    "bandwidth_mbps": bw_mbps,
                                    "progress": dl_progress,
                                    "elapsed": dl_elapsed,
                                },
                            })
                        elif msg_type == "upload":
                            bw = data.get("upload", {}).get("bandwidth", 0)
                            bw_mbps = round(bw * 8 / 1_000_000, 2)
                            ul_progress = data.get("upload", {}).get("progress", 0)
                            ul_elapsed = data.get("upload", {}).get("elapsed", 0)
                            if prev_phase != "upload":
                                logger.info("Phase: Upload")
                                prev_phase = "upload"
                            event_bus.publish({
                                "event": "progress",
                                "data": {
                                    "phase": "upload",
                                    "bandwidth_mbps": bw_mbps,
                                    "progress": ul_progress,
                                    "elapsed": ul_elapsed,
                                },
                            })
                        elif msg_type == "result":
                            final_result = SpeedtestRawResult.model_validate(data)

            try:
                await asyncio.wait_for(read_stdout(), timeout=self.TIMEOUT_SECONDS)
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                event_bus.publish({"event": "error", "data": {"message": "Speedtest timed out"}})
                raise SpeedtestTimeoutError(
                    f"Speedtest timed out after {self.TIMEOUT_SECONDS}s"
                )

            await process.wait()

            if process.returncode != 0:
                stderr_text = ""
                if process.stderr:
                    stderr_bytes = await process.stderr.read()
                    stderr_text = stderr_bytes.decode("utf-8", errors="replace").strip()
                event_bus.publish({"event": "error", "data": {"message": f"Exit code {process.returncode}"}})
                raise SpeedtestError(
                    f"Speedtest exited with code {process.returncode}: {stderr_text}",
                    raw_output=stderr_text,
                )

            if final_result is None:
                event_bus.publish({"event": "error", "data": {"message": "No result received"}})
                raise SpeedtestError("No result received from speedtest", raw_output=buffer)

            logger.info(
                "Speed test complete: down %.1f Mbps, up %.1f Mbps, ping %.1f ms",
                final_result.download_mbps,
                final_result.upload_mbps,
                final_result.ping.latency,
            )
            return final_result

        except FileNotFoundError:
            event_bus.publish({"event": "error", "data": {"message": "Binary not found"}})
            raise SpeedtestBinaryNotFoundError(
                f"Speedtest binary not found at: {self.binary_path}"
            )

    async def list_servers(self) -> list[dict]:
        cmd = [self.binary_path, "--servers", "--format=json", "--accept-license", "--accept-gdpr"]
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=30,
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            raise SpeedtestTimeoutError("Server list request timed out")
        except FileNotFoundError:
            raise SpeedtestBinaryNotFoundError(
                f"Speedtest binary not found at: {self.binary_path}"
            )

        stdout_text = stdout.decode("utf-8", errors="replace").strip()
        if process.returncode != 0:
            stderr_text = stderr.decode("utf-8", errors="replace").strip()
            raise SpeedtestError(
                f"Speedtest exited with code {process.returncode}: {stderr_text}",
                raw_output=stdout_text or stderr_text,
            )

        try:
            data = json.loads(stdout_text)
        except json.JSONDecodeError as e:
            raise SpeedtestError(
                f"Failed to parse server list JSON: {e}",
                raw_output=stdout_text,
            )

        if isinstance(data, dict) and "servers" in data:
            return data["servers"]
        if isinstance(data, list):
            return data
        return []


speedtest_runner = SpeedtestRunner()
