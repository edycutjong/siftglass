export type NodeStatus = 'investigating' | 'malicious' | 'benign' | 'shattered';

export interface InvestigationNode {
  id: string;
  label: string;
  type: 'ip' | 'domain' | 'hash' | 'process' | 'file' | 'user' | 'network';
  status: NodeStatus;
  confidence: number; // 0-100
  details: string;
  timestamp: number;
}

export interface InvestigationEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface AgentState {
  objective: string;
  reasoning: string;
  confidence: number;
  currentTool: string | null;
  phase: 'scanning' | 'investigating' | 'correlating' | 'concluded';
}

export interface TerminalLine {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'agent';
  content: string;
}
