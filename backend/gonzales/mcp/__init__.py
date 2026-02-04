"""
MCP (Model Context Protocol) server for Gonzales.

This module provides MCP integration for AI tools like Claude Desktop,
allowing them to interact with Gonzales speed test data directly.
"""

from gonzales.mcp.server import main, run_server

__all__ = ["main", "run_server"]
