import { InvestigationNode, InvestigationEdge, AgentState, TerminalLine } from './types';

/**
 * Hardcoded Golden Path scenario:
 * An investigation into a supply-chain attack via compromised npm package.
 * Agent investigates → finds false positive → self-corrects → finds real threat.
 *
 * Static timestamps to avoid SSR/client hydration mismatch.
 */

// Fixed base timestamp: 2026-04-21 03:42:00 UTC
const BASE = 1776836520000;

export const DEMO_NODES: InvestigationNode[] = [
  {
    id: 'node-1',
    label: '192.168.1.42',
    type: 'ip',
    status: 'investigating',
    confidence: 85,
    details: 'Internal workstation — unusual outbound traffic detected at 03:42 UTC',
    timestamp: BASE,
  },
  {
    id: 'node-2',
    label: 'evil-pkg@2.1.0',
    type: 'hash',
    status: 'malicious',
    confidence: 95,
    details: 'SHA256: a1b2c3...f9e8 — matches known supply-chain backdoor signature',
    timestamp: BASE + 10000,
  },
  {
    id: 'node-3',
    label: 'cdn.legit-analytics.com',
    type: 'domain',
    status: 'shattered',
    confidence: 15,
    details: 'Initially suspected C2 domain — self-corrected: legitimate CDN provider',
    timestamp: BASE + 20000,
  },
  {
    id: 'node-4',
    label: 'data-exfil.darknet.io',
    type: 'domain',
    status: 'malicious',
    confidence: 98,
    details: 'Confirmed C2 server — TLS cert fingerprint matches APT-41 infrastructure',
    timestamp: BASE + 30000,
  },
  {
    id: 'node-5',
    label: '/tmp/.hidden_shell',
    type: 'file',
    status: 'malicious',
    confidence: 92,
    details: 'Reverse shell binary — dropped by evil-pkg post-install script',
    timestamp: BASE + 40000,
  },
  {
    id: 'node-6',
    label: 'svc_deploy',
    type: 'user',
    status: 'investigating',
    confidence: 70,
    details: 'Service account used for CI/CD — investigating lateral movement',
    timestamp: BASE + 50000,
  },
  {
    id: 'node-7',
    label: 'npm install',
    type: 'process',
    status: 'malicious',
    confidence: 88,
    details: 'PID 4821 — triggered malicious postinstall script',
    timestamp: BASE + 55000,
  },
];

export const DEMO_EDGES: InvestigationEdge[] = [
  { id: 'e1-2', source: 'node-1', target: 'node-2', label: 'installed', animated: true },
  { id: 'e2-3', source: 'node-2', target: 'node-3', label: 'connected to', animated: false },
  { id: 'e2-4', source: 'node-2', target: 'node-4', label: 'exfiltrated to', animated: true },
  { id: 'e2-5', source: 'node-2', target: 'node-5', label: 'dropped', animated: true },
  { id: 'e5-4', source: 'node-5', target: 'node-4', label: 'beaconing', animated: true },
  { id: 'e6-7', source: 'node-6', target: 'node-7', label: 'executed', animated: true },
  { id: 'e7-2', source: 'node-7', target: 'node-2', label: 'loaded', animated: true },
];

export const DEMO_AGENT_STATE: AgentState = {
  objective: 'Investigate anomalous outbound traffic from 192.168.1.42',
  reasoning: 'Tracing supply-chain compromise via malicious npm package → reverse shell → C2 communication',
  confidence: 91,
  currentTool: 'VirusTotal Lookup',
  phase: 'correlating',
};

export const DEMO_TERMINAL: TerminalLine[] = [
  { id: 't1', timestamp: BASE, type: 'info', content: '[OpenClaw] Starting investigation — target: 192.168.1.42' },
  { id: 't2', timestamp: BASE + 5000, type: 'agent', content: '[Agent] Pulling NetFlow logs for last 24h...' },
  { id: 't3', timestamp: BASE + 10000, type: 'warning', content: '[Alert] Unusual DNS query volume from 192.168.1.42 — 847 queries in 5 min' },
  { id: 't4', timestamp: BASE + 15000, type: 'agent', content: '[Agent] Hypothesis: possible C2 beaconing. Checking package artifacts...' },
  { id: 't5', timestamp: BASE + 20000, type: 'success', content: '[MCP:VirusTotal] evil-pkg@2.1.0 flagged by 23/71 engines — Trojan.GenericKD.71498234' },
  { id: 't6', timestamp: BASE + 25000, type: 'error', content: '[Alert] cdn.legit-analytics.com initially flagged as C2 by heuristic model' },
  { id: 't7', timestamp: BASE + 30000, type: 'agent', content: '[Agent] Constraint Mismatch... Self Correcting. cdn.legit-analytics.com is Cloudflare CDN.' },
  { id: 't8', timestamp: BASE + 35000, type: 'success', content: '[Agent] Pivoting → real C2 identified: data-exfil.darknet.io (TLS cert match APT-41)' },
  { id: 't9', timestamp: BASE + 40000, type: 'warning', content: '[MCP:FileHash] /tmp/.hidden_shell — ELF reverse shell, connects to data-exfil.darknet.io:443' },
  { id: 't10', timestamp: BASE + 45000, type: 'agent', content: '[Agent] Kill chain reconstructed: npm install → postinstall → drop shell → exfil to C2' },
  { id: 't11', timestamp: BASE + 50000, type: 'info', content: '[Agent] Investigating lateral movement via svc_deploy service account...' },
  { id: 't12', timestamp: BASE + 55000, type: 'success', content: '[Agent] Investigation confidence: 91% — supply-chain attack confirmed. 4 IOCs extracted.' },
];
