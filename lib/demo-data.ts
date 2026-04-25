import { InvestigationNode, InvestigationEdge, AgentState, TerminalLine } from './types';

// Fixed base timestamp: 2026-04-21 03:42:00 UTC
const BASE = 1776836520000;

/* ─── Scenario type ─── */
export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  nodes: InvestigationNode[];
  edges: InvestigationEdge[];
  agentState: AgentState;
  terminal: TerminalLine[];
  positions: Record<string, { x: number; y: number }>;
}

/* ═══════════════════════════════════════════════════════════════
   SCENARIO 1 — Supply-Chain Attack (original golden path)
   ═══════════════════════════════════════════════════════════════ */

const SC1_NODES: InvestigationNode[] = [
  { id: 'node-1', label: '192.168.1.42', type: 'ip', status: 'investigating', confidence: 85, details: 'Internal workstation — unusual outbound traffic detected at 03:42 UTC', timestamp: BASE },
  { id: 'node-2', label: 'evil-pkg@2.1.0', type: 'hash', status: 'malicious', confidence: 95, details: 'SHA256: a1b2c3...f9e8 — matches known supply-chain backdoor signature', timestamp: BASE + 10000 },
  { id: 'node-3', label: 'cdn.legit-analytics.com', type: 'domain', status: 'shattered', confidence: 15, details: 'Initially suspected C2 domain — self-corrected: legitimate CDN provider', timestamp: BASE + 20000 },
  { id: 'node-4', label: 'data-exfil.darknet.io', type: 'domain', status: 'malicious', confidence: 98, details: 'Confirmed C2 server — TLS cert fingerprint matches APT-41 infrastructure', timestamp: BASE + 30000 },
  { id: 'node-5', label: '/tmp/.hidden_shell', type: 'file', status: 'malicious', confidence: 92, details: 'Reverse shell binary — dropped by evil-pkg post-install script', timestamp: BASE + 40000 },
  { id: 'node-6', label: 'svc_deploy', type: 'user', status: 'investigating', confidence: 70, details: 'Service account used for CI/CD — investigating lateral movement', timestamp: BASE + 50000 },
  { id: 'node-7', label: 'npm install', type: 'process', status: 'malicious', confidence: 88, details: 'PID 4821 — triggered malicious postinstall script', timestamp: BASE + 55000 },
];

const SC1_EDGES: InvestigationEdge[] = [
  { id: 'e1-2', source: 'node-1', target: 'node-2', label: 'installed', animated: true },
  { id: 'e2-3', source: 'node-2', target: 'node-3', label: 'connected to', animated: false },
  { id: 'e2-4', source: 'node-2', target: 'node-4', label: 'exfiltrated to', animated: true },
  { id: 'e2-5', source: 'node-2', target: 'node-5', label: 'dropped', animated: true },
  { id: 'e5-4', source: 'node-5', target: 'node-4', label: 'beaconing', animated: true },
  { id: 'e6-7', source: 'node-6', target: 'node-7', label: 'executed', animated: true },
  { id: 'e7-2', source: 'node-7', target: 'node-2', label: 'loaded', animated: true },
];

const SC1_STATE: AgentState = {
  objective: 'Investigate anomalous outbound traffic from 192.168.1.42',
  reasoning: 'Tracing supply-chain compromise via malicious npm package → reverse shell → C2 communication',
  confidence: 91,
  currentTool: 'VirusTotal Lookup',
  phase: 'correlating',
};

const SC1_TERMINAL: TerminalLine[] = [
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

const SC1_POSITIONS: Record<string, { x: number; y: number }> = {
  'node-1': { x: 50, y: 200 }, 'node-2': { x: 300, y: 200 }, 'node-3': { x: 550, y: 50 },
  'node-4': { x: 550, y: 350 }, 'node-5': { x: 550, y: 200 }, 'node-6': { x: 50, y: 400 },
  'node-7': { x: 300, y: 400 },
};

/* ═══════════════════════════════════════════════════════════════
   SCENARIO 2 — Ransomware Lateral Movement
   ═══════════════════════════════════════════════════════════════ */

const SC2_NODES: InvestigationNode[] = [
  { id: 'r-1', label: '10.0.5.201', type: 'ip', status: 'malicious', confidence: 94, details: 'Patient zero — phishing email opened at 02:17 UTC, macro executed', timestamp: BASE },
  { id: 'r-2', label: 'invoice_q4.docm', type: 'file', status: 'malicious', confidence: 97, details: 'Weaponized OOXML — VBA macro downloads Cobalt Strike stager', timestamp: BASE + 8000 },
  { id: 'r-3', label: 'powershell.exe', type: 'process', status: 'malicious', confidence: 90, details: 'PID 6130 — encoded command downloads beacon from 185.220.101.42', timestamp: BASE + 16000 },
  { id: 'r-4', label: '185.220.101.42', type: 'ip', status: 'malicious', confidence: 96, details: 'Cobalt Strike C2 — Tor exit node, registered to bulletproof host', timestamp: BASE + 24000 },
  { id: 'r-5', label: 'DC01.corp.local', type: 'domain', status: 'malicious', confidence: 88, details: 'Domain controller compromised via Zerologon (CVE-2020-1472)', timestamp: BASE + 32000 },
  { id: 'r-6', label: 'admin_backup', type: 'user', status: 'malicious', confidence: 82, details: 'Domain Admin credentials dumped via LSASS — used for lateral movement', timestamp: BASE + 40000 },
  { id: 'r-7', label: 'lockbit3.exe', type: 'file', status: 'malicious', confidence: 99, details: 'LockBit 3.0 ransomware binary — SMB propagation to 47 hosts', timestamp: BASE + 48000 },
  { id: 'r-8', label: 'VSSADMIN', type: 'process', status: 'malicious', confidence: 85, details: 'Shadow copies deleted — recovery prevention technique', timestamp: BASE + 52000 },
];

const SC2_EDGES: InvestigationEdge[] = [
  { id: 're1', source: 'r-1', target: 'r-2', label: 'opened', animated: true },
  { id: 're2', source: 'r-2', target: 'r-3', label: 'spawned', animated: true },
  { id: 're3', source: 'r-3', target: 'r-4', label: 'beaconed to', animated: true },
  { id: 're4', source: 'r-4', target: 'r-5', label: 'exploited', animated: true },
  { id: 're5', source: 'r-5', target: 'r-6', label: 'credential dump', animated: true },
  { id: 're6', source: 'r-6', target: 'r-7', label: 'deployed', animated: true },
  { id: 're7', source: 'r-7', target: 'r-8', label: 'executed', animated: true },
];

const SC2_STATE: AgentState = {
  objective: 'Trace ransomware kill chain from phishing entry to domain-wide encryption',
  reasoning: 'Phishing → macro → Cobalt Strike → Zerologon → credential harvest → LockBit 3.0 deployment',
  confidence: 94,
  currentTool: 'YARA Rule Scanner',
  phase: 'concluded',
};

const SC2_TERMINAL: TerminalLine[] = [
  { id: 'rt1', timestamp: BASE, type: 'error', content: '[SIEM] CRITICAL: 47 hosts reporting encrypted filesystems — ransomware suspected' },
  { id: 'rt2', timestamp: BASE + 5000, type: 'agent', content: '[Agent] Backtracking encryption origin... scanning email gateway logs' },
  { id: 'rt3', timestamp: BASE + 10000, type: 'warning', content: '[Alert] invoice_q4.docm — VBA macro with obfuscated PowerShell dropper' },
  { id: 'rt4', timestamp: BASE + 15000, type: 'agent', content: '[Agent] Hypothesis: phishing-to-ransomware chain. Tracing C2 callback...' },
  { id: 'rt5', timestamp: BASE + 20000, type: 'success', content: '[MCP:ThreatIntel] 185.220.101.42 — known Cobalt Strike C2, LockBit affiliate' },
  { id: 'rt6', timestamp: BASE + 25000, type: 'error', content: '[Alert] DC01.corp.local compromised — Zerologon exploit detected in Kerberos logs' },
  { id: 'rt7', timestamp: BASE + 30000, type: 'agent', content: '[Agent] Lateral movement confirmed via admin_backup Domain Admin account' },
  { id: 'rt8', timestamp: BASE + 35000, type: 'warning', content: '[MCP:YARA] lockbit3.exe matches LockBit 3.0 signature — SMB worm module active' },
  { id: 'rt9', timestamp: BASE + 40000, type: 'agent', content: '[Agent] Shadow copy deletion detected — VSSADMIN used to prevent recovery' },
  { id: 'rt10', timestamp: BASE + 45000, type: 'info', content: '[Agent] Full kill chain mapped: 8 nodes, 7 hops, patient zero at 10.0.5.201' },
  { id: 'rt11', timestamp: BASE + 50000, type: 'success', content: '[Agent] Recommending: isolate DC01, rotate all domain creds, block 185.220.101.42' },
  { id: 'rt12', timestamp: BASE + 55000, type: 'success', content: '[Agent] Investigation confidence: 94% — LockBit 3.0 ransomware confirmed. 6 IOCs extracted.' },
];

const SC2_POSITIONS: Record<string, { x: number; y: number }> = {
  'r-1': { x: 50, y: 200 }, 'r-2': { x: 250, y: 100 }, 'r-3': { x: 450, y: 100 },
  'r-4': { x: 650, y: 100 }, 'r-5': { x: 450, y: 300 }, 'r-6': { x: 250, y: 400 },
  'r-7': { x: 450, y: 400 }, 'r-8': { x: 650, y: 400 },
};

/* ═══════════════════════════════════════════════════════════════
   SCENARIO 3 — Credential Stuffing Campaign
   ═══════════════════════════════════════════════════════════════ */

const SC3_NODES: InvestigationNode[] = [
  { id: 'c-1', label: '45.33.32.156', type: 'ip', status: 'malicious', confidence: 91, details: 'Residential proxy — 12,847 login attempts in 30 min from this IP', timestamp: BASE },
  { id: 'c-2', label: 'auth.corp.com/login', type: 'domain', status: 'investigating', confidence: 60, details: 'OAuth2 endpoint — abnormal 401 spike: 98.7% failure rate', timestamp: BASE + 8000 },
  { id: 'c-3', label: 'combo_list_2026.txt', type: 'file', status: 'malicious', confidence: 93, details: '2.3M credential pairs — matches leaked RockYou2026 dataset', timestamp: BASE + 16000 },
  { id: 'c-4', label: 'jsmith@corp.com', type: 'user', status: 'malicious', confidence: 87, details: 'Account compromised — successful login after 3,421 attempts', timestamp: BASE + 24000 },
  { id: 'c-5', label: 'api.stripe.com', type: 'domain', status: 'shattered', confidence: 20, details: 'Initially flagged as data exfil — self-corrected: legitimate payment API', timestamp: BASE + 32000 },
  { id: 'c-6', label: 'session_hijack.py', type: 'process', status: 'malicious', confidence: 89, details: 'Automated session token harvester — exfils cookies to Telegram bot', timestamp: BASE + 40000 },
  { id: 'c-7', label: 't.me/dark_creds_bot', type: 'network', status: 'malicious', confidence: 95, details: 'Telegram C2 channel — 847 stolen sessions exfiltrated', timestamp: BASE + 48000 },
];

const SC3_EDGES: InvestigationEdge[] = [
  { id: 'ce1', source: 'c-1', target: 'c-2', label: 'targeted', animated: true },
  { id: 'ce2', source: 'c-1', target: 'c-3', label: 'used list', animated: true },
  { id: 'ce3', source: 'c-3', target: 'c-4', label: 'compromised', animated: true },
  { id: 'ce4', source: 'c-4', target: 'c-5', label: 'accessed', animated: false },
  { id: 'ce5', source: 'c-4', target: 'c-6', label: 'deployed', animated: true },
  { id: 'ce6', source: 'c-6', target: 'c-7', label: 'exfiltrated to', animated: true },
];

const SC3_STATE: AgentState = {
  objective: 'Investigate credential stuffing campaign targeting auth.corp.com',
  reasoning: 'Residential proxy → leaked combo list → account takeover → session hijacking → Telegram exfil',
  confidence: 89,
  currentTool: 'Have I Been Pwned API',
  phase: 'correlating',
};

const SC3_TERMINAL: TerminalLine[] = [
  { id: 'ct1', timestamp: BASE, type: 'error', content: '[WAF] ALERT: 12,847 failed logins from 45.33.32.156 in 30 minutes' },
  { id: 'ct2', timestamp: BASE + 5000, type: 'agent', content: '[Agent] Analyzing login patterns... residential proxy detected (Luminati network)' },
  { id: 'ct3', timestamp: BASE + 10000, type: 'warning', content: '[Alert] Credential list matches RockYou2026 breach dump — 2.3M pairs' },
  { id: 'ct4', timestamp: BASE + 15000, type: 'agent', content: '[Agent] Hypothesis: automated credential stuffing. Checking for successful auths...' },
  { id: 'ct5', timestamp: BASE + 20000, type: 'error', content: '[Alert] Account takeover: jsmith@corp.com — successful login after 3,421 attempts' },
  { id: 'ct6', timestamp: BASE + 25000, type: 'agent', content: '[Agent] Checking post-compromise activity on jsmith session...' },
  { id: 'ct7', timestamp: BASE + 30000, type: 'warning', content: '[Alert] api.stripe.com access from jsmith — initially flagged as exfil' },
  { id: 'ct8', timestamp: BASE + 35000, type: 'agent', content: '[Agent] Constraint Mismatch... Self Correcting. Stripe calls are normal billing API.' },
  { id: 'ct9', timestamp: BASE + 40000, type: 'success', content: '[MCP:NetFlow] Session hijack script detected — cookies exfiltrated to Telegram bot' },
  { id: 'ct10', timestamp: BASE + 45000, type: 'agent', content: '[Agent] C2 channel identified: t.me/dark_creds_bot — 847 stolen sessions' },
  { id: 'ct11', timestamp: BASE + 50000, type: 'info', content: '[Agent] Recommending: force password reset, revoke all jsmith sessions, block proxy range' },
  { id: 'ct12', timestamp: BASE + 55000, type: 'success', content: '[Agent] Investigation confidence: 89% — credential stuffing campaign confirmed. 5 IOCs extracted.' },
];

const SC3_POSITIONS: Record<string, { x: number; y: number }> = {
  'c-1': { x: 50, y: 200 }, 'c-2': { x: 300, y: 50 }, 'c-3': { x: 300, y: 350 },
  'c-4': { x: 500, y: 200 }, 'c-5': { x: 700, y: 50 }, 'c-6': { x: 500, y: 400 },
  'c-7': { x: 700, y: 400 },
};

/* ═══════════════════════════════════════════════════════════════
   SCENARIO 4 — Insider Threat / Data Exfiltration
   ═══════════════════════════════════════════════════════════════ */

const SC4_NODES: InvestigationNode[] = [
  { id: 'i-1', label: 'mwilson', type: 'user', status: 'malicious', confidence: 86, details: 'Senior engineer — submitted resignation 3 days ago, accessing restricted repos', timestamp: BASE },
  { id: 'i-2', label: 'git clone (bulk)', type: 'process', status: 'malicious', confidence: 92, details: 'PID 9102 — cloned 23 private repos in 12 min (normal: 2-3/week)', timestamp: BASE + 8000 },
  { id: 'i-3', label: 'proprietary-ml-model/', type: 'file', status: 'malicious', confidence: 95, details: 'Trade secret ML model weights — 4.7 GB downloaded to local disk', timestamp: BASE + 16000 },
  { id: 'i-4', label: 'mega.nz/upload', type: 'domain', status: 'malicious', confidence: 93, details: 'Cloud storage upload — 4.8 GB encrypted archive to personal MEGA account', timestamp: BASE + 24000 },
  { id: 'i-5', label: 'USB: SanDisk_Ultra', type: 'file', status: 'investigating', confidence: 72, details: 'USB mass storage connected at 02:51 UTC — 3.2 GB written', timestamp: BASE + 32000 },
  { id: 'i-6', label: 'vpn-gateway.corp.com', type: 'domain', status: 'shattered', confidence: 18, details: 'Initially flagged unusual VPN hours — self-corrected: authorized remote access policy', timestamp: BASE + 40000 },
  { id: 'i-7', label: 'DLP alert #4891', type: 'network', status: 'malicious', confidence: 88, details: 'Data Loss Prevention triggered — sensitive file patterns in outbound traffic', timestamp: BASE + 48000 },
];

const SC4_EDGES: InvestigationEdge[] = [
  { id: 'ie1', source: 'i-1', target: 'i-2', label: 'executed', animated: true },
  { id: 'ie2', source: 'i-2', target: 'i-3', label: 'downloaded', animated: true },
  { id: 'ie3', source: 'i-3', target: 'i-4', label: 'uploaded to', animated: true },
  { id: 'ie4', source: 'i-3', target: 'i-5', label: 'copied to', animated: true },
  { id: 'ie5', source: 'i-1', target: 'i-6', label: 'connected via', animated: false },
  { id: 'ie6', source: 'i-4', target: 'i-7', label: 'triggered', animated: true },
  { id: 'ie7', source: 'i-5', target: 'i-7', label: 'triggered', animated: true },
];

const SC4_STATE: AgentState = {
  objective: 'Investigate suspected insider data exfiltration by departing employee',
  reasoning: 'Departing engineer → bulk repo clone → trade secret download → dual exfil (cloud + USB)',
  confidence: 88,
  currentTool: 'DLP Log Analyzer',
  phase: 'correlating',
};

const SC4_TERMINAL: TerminalLine[] = [
  { id: 'it1', timestamp: BASE, type: 'warning', content: '[DLP] Alert #4891: Bulk data transfer detected from mwilson workstation' },
  { id: 'it2', timestamp: BASE + 5000, type: 'agent', content: '[Agent] Cross-referencing HR records... mwilson submitted resignation 72h ago' },
  { id: 'it3', timestamp: BASE + 10000, type: 'error', content: '[Alert] 23 private repos cloned in 12 minutes — 10x normal baseline for this user' },
  { id: 'it4', timestamp: BASE + 15000, type: 'agent', content: '[Agent] Hypothesis: pre-departure data hoarding. Checking sensitive file access...' },
  { id: 'it5', timestamp: BASE + 20000, type: 'error', content: '[Alert] proprietary-ml-model/ accessed — classified as TRADE SECRET (IP level 5)' },
  { id: 'it6', timestamp: BASE + 25000, type: 'warning', content: '[Alert] VPN session from mwilson at 02:30 UTC — outside normal work hours' },
  { id: 'it7', timestamp: BASE + 30000, type: 'agent', content: '[Agent] Constraint Mismatch... Self Correcting. VPN access authorized per remote policy.' },
  { id: 'it8', timestamp: BASE + 35000, type: 'success', content: '[MCP:NetFlow] 4.8 GB encrypted upload to mega.nz — personal account (not corporate)' },
  { id: 'it9', timestamp: BASE + 40000, type: 'warning', content: '[MCP:USB] SanDisk Ultra connected — 3.2 GB written matching proprietary-ml-model/ hashes' },
  { id: 'it10', timestamp: BASE + 45000, type: 'agent', content: '[Agent] Dual exfil path confirmed: cloud (MEGA) + physical (USB) — sophisticated tradecraft' },
  { id: 'it11', timestamp: BASE + 50000, type: 'info', content: '[Agent] Recommending: revoke mwilson access, legal hold on MEGA account, retain USB device' },
  { id: 'it12', timestamp: BASE + 55000, type: 'success', content: '[Agent] Investigation confidence: 88% — insider threat confirmed. 5 IOCs extracted.' },
];

const SC4_POSITIONS: Record<string, { x: number; y: number }> = {
  'i-1': { x: 50, y: 200 }, 'i-2': { x: 300, y: 100 }, 'i-3': { x: 500, y: 200 },
  'i-4': { x: 700, y: 80 }, 'i-5': { x: 700, y: 320 }, 'i-6': { x: 300, y: 380 },
  'i-7': { x: 500, y: 400 },
};

/* ─── Assembled scenarios ─── */

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'supply-chain',
    title: 'Supply-Chain Attack',
    description: 'Compromised npm package → reverse shell → C2 exfiltration',
    nodes: SC1_NODES, edges: SC1_EDGES, agentState: SC1_STATE,
    terminal: SC1_TERMINAL, positions: SC1_POSITIONS,
  },
  {
    id: 'ransomware',
    title: 'Ransomware Lateral Movement',
    description: 'Phishing → Cobalt Strike → Zerologon → LockBit 3.0 deployment',
    nodes: SC2_NODES, edges: SC2_EDGES, agentState: SC2_STATE,
    terminal: SC2_TERMINAL, positions: SC2_POSITIONS,
  },
  {
    id: 'credential-stuffing',
    title: 'Credential Stuffing',
    description: 'Residential proxy → leaked combo list → session hijack → Telegram exfil',
    nodes: SC3_NODES, edges: SC3_EDGES, agentState: SC3_STATE,
    terminal: SC3_TERMINAL, positions: SC3_POSITIONS,
  },
  {
    id: 'insider-threat',
    title: 'Insider Threat',
    description: 'Departing employee → bulk repo clone → dual exfil (cloud + USB)',
    nodes: SC4_NODES, edges: SC4_EDGES, agentState: SC4_STATE,
    terminal: SC4_TERMINAL, positions: SC4_POSITIONS,
  },
];

/* ─── Backwards-compatible exports (default = scenario 0) ─── */

export const DEMO_NODES = SC1_NODES;
export const DEMO_EDGES = SC1_EDGES;
export const DEMO_AGENT_STATE = SC1_STATE;
export const DEMO_TERMINAL = SC1_TERMINAL;
