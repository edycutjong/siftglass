"""
SIFTGlass MCP Server — exposes IR investigation tools to the OpenClaw agent.
Writes state to Supabase so the frontend can subscribe via Realtime.
Run with: python mcp_server.py
"""

import asyncio
import json
import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
import mcp.types as types
from supabase import create_client, Client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Known-malicious hashes (simulated threat intel)
MALICIOUS_HASHES: dict[str, str] = {
    "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2": "Trojan.GenericKD.71498234 — supply-chain backdoor",
}

# Known-malicious domains
MALICIOUS_DOMAINS: dict[str, str] = {
    "data-exfil.darknet.io": "APT-41 C2 infrastructure — TLS cert fingerprint match",
}

# Known-legitimate domains (used for constraint checking / false-positive detection)
LEGITIMATE_DOMAINS: set[str] = {
    "cdn.legit-analytics.com",
    "cloudflare.com",
    "amazonaws.com",
    "fastly.net",
    "akamaihd.net",
}

server = Server("siftglass-ir")
_supabase: Client | None = None
_session_id: str = ""


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─────────────────────────────────────────────────────────────
# Tool definitions
# ─────────────────────────────────────────────────────────────

@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="set_session",
            description="Initialize a new investigation session. Call this first.",
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string", "description": "Unique session ID (UUID)"},
                    "objective": {"type": "string", "description": "Investigation objective"},
                },
                "required": ["session_id", "objective"],
            },
        ),
        types.Tool(
            name="report_node",
            description="Add a new investigation node to the graph (IP, domain, hash, file, process, user, network).",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Unique node ID"},
                    "label": {"type": "string", "description": "Display label (e.g. IP address, domain name)"},
                    "type": {"type": "string", "enum": ["ip", "domain", "hash", "process", "file", "user", "network"]},
                    "details": {"type": "string", "description": "Investigation context or evidence"},
                    "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                    "position_x": {"type": "number", "default": 0},
                    "position_y": {"type": "number", "default": 0},
                },
                "required": ["id", "label", "type", "details", "confidence"],
            },
        ),
        types.Tool(
            name="update_node_status",
            description="Update a node's status and confidence after gathering evidence.",
            inputSchema={
                "type": "object",
                "properties": {
                    "node_id": {"type": "string"},
                    "status": {"type": "string", "enum": ["investigating", "malicious", "benign", "shattered"]},
                    "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                    "details": {"type": "string", "description": "Updated evidence or reason for status change"},
                },
                "required": ["node_id", "status", "confidence"],
            },
        ),
        types.Tool(
            name="add_edge",
            description="Add a directed relationship edge between two investigation nodes.",
            inputSchema={
                "type": "object",
                "properties": {
                    "source": {"type": "string", "description": "Source node ID"},
                    "target": {"type": "string", "description": "Target node ID"},
                    "label": {"type": "string", "description": "Relationship label (e.g. 'installed', 'connected to')"},
                    "animated": {"type": "boolean", "default": True},
                },
                "required": ["source", "target", "label"],
            },
        ),
        types.Tool(
            name="hash_constraint_check",
            description="Check a file SHA256 hash against known threat intelligence. Returns threat classification or 'clean'.",
            inputSchema={
                "type": "object",
                "properties": {
                    "sha256": {"type": "string", "description": "SHA256 hash to check"},
                    "filename": {"type": "string", "description": "File name for context"},
                },
                "required": ["sha256"],
            },
        ),
        types.Tool(
            name="domain_reputation",
            description="Check a domain's reputation. Returns 'malicious', 'legitimate', or 'unknown' with reasoning.",
            inputSchema={
                "type": "object",
                "properties": {
                    "domain": {"type": "string", "description": "Domain to check"},
                },
                "required": ["domain"],
            },
        ),
        types.Tool(
            name="cancel_hypothesis",
            description="Self-correction: mark a node as shattered (false positive) and remove its edges. Call when a constraint mismatch is detected.",
            inputSchema={
                "type": "object",
                "properties": {
                    "node_id": {"type": "string", "description": "Node ID to shatter"},
                    "reason": {"type": "string", "description": "Why this hypothesis is being cancelled"},
                },
                "required": ["node_id", "reason"],
            },
        ),
        types.Tool(
            name="update_agent_state",
            description="Update the agent's visible state on the dashboard banner.",
            inputSchema={
                "type": "object",
                "properties": {
                    "objective": {"type": "string"},
                    "reasoning": {"type": "string"},
                    "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                    "current_tool": {"type": "string"},
                    "phase": {"type": "string", "enum": ["scanning", "investigating", "correlating", "concluded"]},
                },
                "required": ["reasoning", "confidence", "phase"],
            },
        ),
        types.Tool(
            name="log_terminal",
            description="Append a line to the investigation terminal panel.",
            inputSchema={
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["info", "warning", "error", "success", "agent"]},
                    "content": {"type": "string"},
                },
                "required": ["type", "content"],
            },
        ),
    ]


# ─────────────────────────────────────────────────────────────
# Tool implementations
# ─────────────────────────────────────────────────────────────

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    global _session_id
    sb = get_supabase()

    if name == "set_session":
        _session_id = arguments["session_id"]
        sb.table("agent_state").upsert({
            "session_id": _session_id,
            "objective": arguments["objective"],
            "reasoning": "Starting investigation...",
            "confidence": 0,
            "phase": "scanning",
        }).execute()
        return [types.TextContent(type="text", text=f"Session {_session_id} initialized.")]

    if not _session_id:
        return [types.TextContent(type="text", text="ERROR: call set_session first.")]

    if name == "report_node":
        sb.table("investigation_nodes").upsert({
            "id": arguments["id"],
            "session_id": _session_id,
            "label": arguments["label"],
            "type": arguments["type"],
            "status": "investigating",
            "confidence": arguments["confidence"],
            "details": arguments["details"],
            "position_x": arguments.get("position_x", 0),
            "position_y": arguments.get("position_y", 0),
        }).execute()
        return [types.TextContent(type="text", text=f"Node '{arguments['label']}' reported.")]

    if name == "update_node_status":
        update: dict = {
            "status": arguments["status"],
            "confidence": arguments["confidence"],
        }
        if "details" in arguments:
            update["details"] = arguments["details"]
        sb.table("investigation_nodes").update(update).eq("id", arguments["node_id"]).execute()
        return [types.TextContent(type="text", text=f"Node {arguments['node_id']} → {arguments['status']} ({arguments['confidence']}%).")]

    if name == "add_edge":
        edge_id = f"e-{arguments['source']}-{arguments['target']}"
        sb.table("investigation_edges").upsert({
            "id": edge_id,
            "session_id": _session_id,
            "source": arguments["source"],
            "target": arguments["target"],
            "label": arguments["label"],
            "animated": arguments.get("animated", True),
        }).execute()
        return [types.TextContent(type="text", text=f"Edge: {arguments['source']} → {arguments['target']} ({arguments['label']}).")]

    if name == "hash_constraint_check":
        sha256 = arguments["sha256"].lower()
        if sha256 in MALICIOUS_HASHES:
            result = f"MALICIOUS: {MALICIOUS_HASHES[sha256]}"
        else:
            result = "CLEAN: no known threat signatures"
        return [types.TextContent(type="text", text=result)]

    if name == "domain_reputation":
        domain = arguments["domain"].lower()
        if domain in MALICIOUS_DOMAINS:
            result = f"MALICIOUS: {MALICIOUS_DOMAINS[domain]}"
        elif domain in LEGITIMATE_DOMAINS:
            result = f"LEGITIMATE: known CDN/infrastructure provider — not a threat indicator"
        else:
            result = "UNKNOWN: no reputation data available"
        return [types.TextContent(type="text", text=result)]

    if name == "cancel_hypothesis":
        # Mark the node as shattered
        sb.table("investigation_nodes").update({
            "status": "shattered",
            "confidence": 0,
            "details": f"Hypothesis cancelled: {arguments['reason']}",
        }).eq("id", arguments["node_id"]).execute()
        # Delete outgoing edges from this node
        sb.table("investigation_edges").delete().eq("source", arguments["node_id"]).execute()
        return [types.TextContent(type="text", text=f"Hypothesis shattered: {arguments['node_id']}. Reason: {arguments['reason']}")]

    if name == "update_agent_state":
        update = {
            "reasoning": arguments["reasoning"],
            "confidence": arguments["confidence"],
            "phase": arguments["phase"],
        }
        if "objective" in arguments:
            update["objective"] = arguments["objective"]
        if "current_tool" in arguments:
            update["current_tool"] = arguments["current_tool"]
        sb.table("agent_state").update(update).eq("session_id", _session_id).execute()
        return [types.TextContent(type="text", text="Agent state updated.")]

    if name == "log_terminal":
        line_id = str(uuid.uuid4())
        sb.table("terminal_lines").insert({
            "id": line_id,
            "session_id": _session_id,
            "type": arguments["type"],
            "content": arguments["content"],
        }).execute()
        return [types.TextContent(type="text", text="Logged.")]

    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]


# ─────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
