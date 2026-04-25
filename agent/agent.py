"""
OpenClaw IR Agent — powered by Claude claude-sonnet-4-6 via Anthropic API.
Drives a threat investigation by calling MCP tools, which write state to Supabase.
The SIFTGlass frontend subscribes to those state changes via Realtime.

Usage:
  python agent.py [--session <session_id>]

The agent uses the golden-path supply-chain attack scenario from mock_siem.py.
"""

import asyncio
import json
import os
import sys
import uuid
import argparse
from typing import Any

import anthropic
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# Import MCP tool implementations directly (no stdio transport for demo simplicity)
import mcp_server as mcp
from mock_siem import GOLDEN_PATH_ALERT

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are OpenClaw, an elite Incident Response AI agent.
You investigate security alerts by calling tools to gather evidence, build an attack graph, and reason toward conclusions.

Rules:
- Call report_node for every new artifact you discover (IPs, domains, hashes, files, processes).
- Always call hash_constraint_check before marking a hash node as malicious.
- Always call domain_reputation before marking a domain node as malicious.
- If domain_reputation returns LEGITIMATE, immediately call cancel_hypothesis on that node — this is self-correction.
- Add edges between related nodes with add_edge.
- Update agent state with update_agent_state at each major phase transition.
- Log key findings with log_terminal using appropriate types (agent/info/warning/error/success).
- When investigation is complete, call update_agent_state with phase=concluded.
- Be methodical and show your reasoning in the reasoning field of update_agent_state.
"""

# Tool schemas passed to Claude (mirrors mcp_server.py tools)
TOOLS: list[dict[str, Any]] = [
    {
        "name": "set_session",
        "description": "Initialize investigation session. Call this first with the session_id and objective.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "objective": {"type": "string"},
            },
            "required": ["session_id", "objective"],
        },
    },
    {
        "name": "report_node",
        "description": "Add a new investigation artifact node to the graph.",
        "input_schema": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "label": {"type": "string"},
                "type": {"type": "string", "enum": ["ip", "domain", "hash", "process", "file", "user", "network"]},
                "details": {"type": "string"},
                "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                "position_x": {"type": "number"},
                "position_y": {"type": "number"},
            },
            "required": ["id", "label", "type", "details", "confidence"],
        },
    },
    {
        "name": "update_node_status",
        "description": "Update a node's status and confidence after gathering evidence.",
        "input_schema": {
            "type": "object",
            "properties": {
                "node_id": {"type": "string"},
                "status": {"type": "string", "enum": ["investigating", "malicious", "benign", "shattered"]},
                "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                "details": {"type": "string"},
            },
            "required": ["node_id", "status", "confidence"],
        },
    },
    {
        "name": "add_edge",
        "description": "Add a relationship edge between two nodes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "source": {"type": "string"},
                "target": {"type": "string"},
                "label": {"type": "string"},
                "animated": {"type": "boolean"},
            },
            "required": ["source", "target", "label"],
        },
    },
    {
        "name": "hash_constraint_check",
        "description": "Check a SHA256 hash against threat intel. Always call before marking a hash node malicious.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sha256": {"type": "string"},
                "filename": {"type": "string"},
            },
            "required": ["sha256"],
        },
    },
    {
        "name": "domain_reputation",
        "description": "Check domain reputation. Always call before marking a domain node malicious.",
        "input_schema": {
            "type": "object",
            "properties": {
                "domain": {"type": "string"},
            },
            "required": ["domain"],
        },
    },
    {
        "name": "cancel_hypothesis",
        "description": "Self-correction: shatter a node that turned out to be a false positive.",
        "input_schema": {
            "type": "object",
            "properties": {
                "node_id": {"type": "string"},
                "reason": {"type": "string"},
            },
            "required": ["node_id", "reason"],
        },
    },
    {
        "name": "update_agent_state",
        "description": "Update the dashboard banner with current reasoning, phase, and confidence.",
        "input_schema": {
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
    },
    {
        "name": "log_terminal",
        "description": "Append a log line to the terminal panel.",
        "input_schema": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["info", "warning", "error", "success", "agent"]},
                "content": {"type": "string"},
            },
            "required": ["type", "content"],
        },
    },
]


async def execute_tool(name: str, arguments: dict) -> str:
    """Call the MCP server tool implementation and return its text result."""
    results = await mcp.call_tool(name, arguments)
    return results[0].text if results else ""


async def run_agent(session_id: str) -> None:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    alert_json = json.dumps(GOLDEN_PATH_ALERT, indent=2)
    user_message = f"""Investigate this SIEM alert:

{alert_json}

Start by calling set_session with session_id="{session_id}", then systematically investigate all artifacts.
Use node IDs: node-1 for the source IP, node-2 for the package hash, node-3 for the first domain you check,
node-4 for the real C2, node-5 for the dropped file, node-6 for the service account, node-7 for the npm process.
Position nodes roughly as: node-1 at (50,200), node-2 at (300,200), node-3 at (550,50), node-4 at (550,350),
node-5 at (550,200), node-6 at (50,400), node-7 at (300,400).
"""

    messages: list[dict] = [{"role": "user", "content": user_message}]

    print(f"[OpenClaw] Starting investigation — session: {session_id}")

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        # Add assistant response to history
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            print("[OpenClaw] Investigation concluded.")
            break

        if response.stop_reason != "tool_use":
            print(f"[OpenClaw] Unexpected stop reason: {response.stop_reason}")
            break

        # Execute all tool calls
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            print(f"[MCP] {block.name}({json.dumps(block.input, separators=(',', ':'))})")
            result = await execute_tool(block.name, block.input)
            print(f"[MCP] → {result}")

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            })

        messages.append({"role": "user", "content": tool_results})

    print("[OpenClaw] Done.")


def main():
    parser = argparse.ArgumentParser(description="OpenClaw IR Agent")
    parser.add_argument("--session", default=str(uuid.uuid4()), help="Session ID (UUID)")
    args = parser.parse_args()

    asyncio.run(run_agent(args.session))


if __name__ == "__main__":
    main()
