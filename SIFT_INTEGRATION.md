# SIFT Workstation Integration

To meet the core platform requirements of the **FIND EVIL! 2026** hackathon, SIFT.Glass is designed for seamless integration with the **SANS SIFT (SANS Investigative Forensic Toolkit) Workstation**.

Our architecture ensures that the incident response (IR) tools you already rely on within the SIFT Workstation environment can effortlessly connect with the SIFT.Glass visualization engine.

## Architectural Compatibility

SIFT.Glass consists of a decoupled architecture:
1. **The Visualization Dashboard (Next.js)**: Can be hosted anywhere (Vercel, local network, etc.).
2. **The Intelligence Agent (Python)**: Runs locally alongside your forensic tools.
3. **The State Bus (Supabase)**: Handles real-time telemetry syncing.

### 1. Agent Deployment on SIFT Workstation
The `agent.py` script is fully compatible with the standard Ubuntu-based SIFT Workstation environment. Since it is written in standard Python 3.11+, you can run it directly within the SIFT VM:

```bash
# Inside your SIFT Workstation terminal
git clone https://github.com/edycutjong/siftglass
cd siftglass/agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python agent.py
```

### 2. Forensic Tool Handoff via MCP
Currently, the SIFT.Glass agent uses `mock_siem.py` to simulate an alert. In a production SIFT environment, the agent can be extended via the **Model Context Protocol (MCP)** to ingest outputs directly from tools natively available in SIFT, such as:
- **Plaso (log2timeline)**: Ingesting parsed timeline events to visualize the attacker's path.
- **Volatility**: Extracting memory artifacts (e.g., malformed processes) and streaming them as nodes to the SIFT.Glass dashboard.
- **Rekall**: Reporting memory forensics findings.

Because the MCP server (`mcp_server.py`) acts as the bridge between local scripts and the Supabase realtime bus, any CLI tool output in SIFT can be easily wrapped in an MCP tool and sent to the visualization dashboard.

### 3. Air-Gapped and Secure Environments
While the hackathon demo uses Supabase Cloud and Anthropic's API, the architecture allows for completely isolated deployments.
- The Supabase stack can be run entirely via Docker inside the SIFT Workstation (`supabase start`).
- The Claude API can be swapped out for a local LLM running on the host machine (e.g., Llama 3 via Ollama) to maintain operational security in air-gapped forensic environments.

## Conclusion

By running the SIFT.Glass agent directly within the SANS SIFT Workstation, forensic analysts gain a real-time, visual, and collaborative canvas for their ongoing investigations without needing to switch contexts or leave their trusted forensic toolkit.
