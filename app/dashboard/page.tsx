'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import InvestigationNodeComponent from '@/components/soc/InvestigationNode';
import AgentBanner from '@/components/soc/AgentBanner';
import TerminalPanel from '@/components/soc/TerminalPanel';
import ScenarioPicker from '@/components/soc/ScenarioPicker';
import { DEMO_SCENARIOS, DEMO_NODES, DEMO_EDGES, DEMO_AGENT_STATE, DEMO_TERMINAL } from '@/lib/demo-data';
import type { DemoScenario } from '@/lib/demo-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AgentState, TerminalLine } from '@/lib/types';

const nodeTypes: NodeTypes = {
  investigation: InvestigationNodeComponent,
};

export function dbNodeToFlow(row: Record<string, unknown>): Node {
  return {
    id: row.id as string,
    type: 'investigation',
    position: { x: (row.position_x as number) ?? 0, y: (row.position_y as number) ?? 0 },
    data: {
      label: row.label,
      nodeType: row.type,
      status: row.status,
      confidence: row.confidence,
      details: row.details,
    },
  };
}

export function dbEdgeToFlow(row: Record<string, unknown>): Edge {
  return {
    id: row.id as string,
    source: row.source as string,
    target: row.target as string,
    label: row.label as string | undefined,
    animated: (row.animated as boolean) ?? false,
    style: {
      stroke: '#06b6d4',
      strokeWidth: 2,
    },
    labelStyle: {
      fill: '#94a3b8',
      fontSize: 10,
      fontFamily: 'JetBrains Mono, monospace',
    },
    labelBgStyle: {
      fill: '#09090b',
      fillOpacity: 0.8,
    },
  };
}

export function scenarioNodesToFlow(scenario: DemoScenario): Node[] {
  return scenario.nodes.map((n) => ({
    id: n.id,
    type: 'investigation',
    position: scenario.positions[n.id] || { x: 0, y: 0 },
    data: {
      label: n.label,
      nodeType: n.type,
      status: n.status,
      confidence: n.confidence,
      details: n.details,
    },
  }));
}

export function scenarioEdgesToFlow(scenario: DemoScenario): Edge[] {
  // Build set of shattered node IDs for this scenario
  const shatteredSources = new Set(
    scenario.nodes.filter((n) => n.status === 'shattered').map((n) => n.id)
  );
  return scenario.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated,
    style: {
      stroke: shatteredSources.has(e.target) || !e.animated ? '#475569' : '#06b6d4',
      strokeWidth: 2,
    },
    labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
    labelBgStyle: { fill: '#09090b', fillOpacity: 0.8 },
  }));
}

/** @deprecated Use scenarioNodesToFlow instead — kept for backwards compat */
export function demoNodesToFlow(): Node[] {
  return scenarioNodesToFlow(DEMO_SCENARIOS[0]);
}

/** @deprecated Use scenarioEdgesToFlow instead — kept for backwards compat */
export function demoEdgesToFlow(): Edge[] {
  return scenarioEdgesToFlow(DEMO_SCENARIOS[0]);
}

export default function DashboardPage() {
  const defaultScenario = DEMO_SCENARIOS[0];
  const [activeScenarioId, setActiveScenarioId] = useState(defaultScenario.id);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(scenarioNodesToFlow(defaultScenario));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(scenarioEdgesToFlow(defaultScenario));
  const [agentState, setAgentState] = useState<AgentState>(DEMO_AGENT_STATE);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(DEMO_TERMINAL);
  const [isLive, setIsLive] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const flowRef = useRef<{ fitView: () => void } | null>(null);

  const handleScenarioChange = useCallback((scenarioId: string) => {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    setActiveScenarioId(scenarioId);
    setNodes(scenarioNodesToFlow(scenario));
    setEdges(scenarioEdgesToFlow(scenario));
    setAgentState(scenario.agentState);
    setTerminalLines(scenario.terminal);
    setIsLive(false);
    // Fit view after state update
    setTimeout(() => flowRef.current?.fitView(), 50);
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Determine session: prefer ?session= query param, then latest from agent_state
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    async function bootstrap(sessionId: string) {
      sessionRef.current = sessionId;

      // Load initial state from DB
      const [nodesRes, edgesRes, stateRes, terminalRes] = await Promise.all([
        supabase.from('investigation_nodes').select('*').eq('session_id', sessionId).order('created_at'),
        supabase.from('investigation_edges').select('*').eq('session_id', sessionId).order('created_at'),
        supabase.from('agent_state').select('*').eq('session_id', sessionId).single(),
        supabase.from('terminal_lines').select('*').eq('session_id', sessionId).order('created_at'),
      ]);

      if (nodesRes.data && nodesRes.data.length > 0) {
        setNodes(nodesRes.data.map(dbNodeToFlow));
        setIsLive(true);
      }
      if (edgesRes.data) setEdges(edgesRes.data.map(dbEdgeToFlow));
      if (stateRes.data) {
        setAgentState({
          objective: stateRes.data.objective,
          reasoning: stateRes.data.reasoning,
          confidence: stateRes.data.confidence,
          currentTool: stateRes.data.current_tool,
          phase: stateRes.data.phase,
        });
      }
      if (terminalRes.data && terminalRes.data.length > 0) {
        setTerminalLines(
          terminalRes.data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            timestamp: new Date(r.created_at as string).getTime(),
            type: r.type as TerminalLine['type'],
            content: r.content as string,
          }))
        );
      }
    }

    async function init() {
      if (sessionParam) {
        await bootstrap(sessionParam);
      } else {
        // Find the most recent session
        const { data } = await supabase
          .from('agent_state')
          .select('session_id')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        if (data) await bootstrap(data.session_id);
      }
    }

    init();

    // Realtime subscriptions
    const channel = supabase
      .channel('siftglass-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investigation_nodes' }, (payload) => {
        const sid = sessionRef.current;
        if (!sid) return;

        if (payload.eventType === 'INSERT') {
          const row = payload.new as Record<string, unknown>;
          if (row.session_id !== sid) return;
          setNodes((prev) => [...prev.filter((n) => n.id !== row.id), dbNodeToFlow(row)]);
          setIsLive(true);
        } else if (payload.eventType === 'UPDATE') {
          const row = payload.new as Record<string, unknown>;
          if (row.session_id !== sid) return;
          setNodes((prev) =>
            prev.map((n) => (n.id === row.id ? { ...n, data: { ...n.data, status: row.status, confidence: row.confidence, details: row.details } } : n))
          );
        } else if (payload.eventType === 'DELETE') {
          const deleted = payload.old as Record<string, unknown>;
          setNodes((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investigation_edges' }, (payload) => {
        const sid = sessionRef.current;
        if (!sid) return;
        if (payload.eventType === 'INSERT') {
          const row = payload.new as Record<string, unknown>;
          if (row.session_id !== sid) return;
          setEdges((prev) => [...prev.filter((e) => e.id !== row.id), dbEdgeToFlow(row)]);
        } else if (payload.eventType === 'DELETE') {
          const deleted = payload.old as Record<string, unknown>;
          setEdges((prev) => prev.filter((e) => e.id !== deleted.id));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agent_state' }, (payload) => {
        const sid = sessionRef.current;
        if (!sid) return;
        const row = payload.new as Record<string, unknown>;
        if (row.session_id !== sid) return;
        setAgentState({
          objective: row.objective as string,
          reasoning: row.reasoning as string,
          confidence: row.confidence as number,
          currentTool: row.current_tool as string | null,
          phase: row.phase as AgentState['phase'],
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'terminal_lines' }, (payload) => {
        const sid = sessionRef.current;
        if (!sid) return;
        const row = payload.new as Record<string, unknown>;
        if (row.session_id !== sid) return;
        setTerminalLines((prev) => [
          ...prev,
          {
            id: row.id as string,
            timestamp: new Date(row.created_at as string).getTime(),
            type: row.type as TerminalLine['type'],
            content: row.content as string,
          },
        ]);
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#030712]">
      <header
        className="flex-shrink-0 border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between relative bg-cyan-950/10 shadow-[0_4px_30px_rgba(6,182,212,0.05)]"
      >
        {/* Subtle scanline overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,1) 2px, rgba(6,182,212,1) 3px)',
        }} />

        <div className="flex items-center gap-5 relative z-10">
          <Link href="/" className="flex items-center gap-5 hover:opacity-80 transition-opacity">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.2)] border border-cyan-500/30 bg-cyan-500/10"
            >
              <Image src="/icon.svg" alt="SIFT.Glass" width={32} height={32} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">SIFT</span>
              <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">.Glass</span>
            </h1>
          </Link>
          <span
            className="ml-2 text-[12px] font-mono font-extrabold tracking-widest px-4 py-1.5 rounded-full uppercase border-2 border-cyan-300 bg-cyan-400/20 text-white shadow-[0_0_25px_rgba(6,182,212,0.8),inset_0_0_10px_rgba(6,182,212,0.5)] backdrop-blur-md"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(6,182,212,0.8)' }}
          >
            v1.0.1 — FIND EVIL!
          </span>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <ScenarioPicker
            scenarios={DEMO_SCENARIOS}
            activeId={activeScenarioId}
            onSelect={handleScenarioChange}
            disabled={isLive}
          />
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-lg transition-all duration-500 ${isLive ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
            <div
              className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'}`}
              style={isLive ? { boxShadow: '0 0 12px rgba(34,197,94,0.8), 0 0 20px rgba(34,197,94,0.4)' } : {}}
            />
            <span className={`text-[11px] font-mono font-bold tracking-widest ${isLive ? 'text-green-300 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'text-zinc-400'}`}>
              {isLive ? 'AGENT LIVE' : 'DEMO MODE'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 px-4 py-2">
        <AgentBanner state={agentState} />
      </div>

      <div className="flex-1 flex gap-3 px-4 pb-4 min-h-0">
        <div className="flex-[7] glass-panel overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onInit={(instance) => { flowRef.current = instance; }}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255,255,255,0.03)"
            />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const status = (node.data as Record<string, unknown>)?.status as string;
                if (status === 'malicious') return '#ef4444';
                if (status === 'investigating') return '#06b6d4';
                if (status === 'shattered') return '#475569';
                return '#22c55e';
              }}
              maskColor="rgba(9,9,11,0.8)"
            />
          </ReactFlow>
        </div>

        <div className="flex-[3] min-w-0">
          <TerminalPanel lines={terminalLines} />
        </div>
      </div>
    </div>
  );
}
