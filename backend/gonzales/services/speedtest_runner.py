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

    async def run(self) -> SpeedtestRawResult:
        logger.info("Starting speed test...")
        cmd = [self.binary_path, "--format=json", "--accept-license", "--accept-gdpr"]

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
            "Speed test complete: ↓ %.1f Mbps, ↑ %.1f Mbps, ping %.1f ms",
            result.download_mbps,
            result.upload_mbps,
            result.ping.latency,
        )
        return result


speedtest_runner = SpeedtestRunner()
