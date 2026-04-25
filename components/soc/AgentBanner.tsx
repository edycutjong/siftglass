'use client';

import { AgentState } from '@/lib/types';

interface AgentBannerProps {
  state: AgentState;
}

const PHASE_LABELS: Record<AgentState['phase'], { label: string; color: string }> = {
  scanning: { label: 'SCANNING', color: 'text-cyan-400' },
  investigating: { label: 'INVESTIGATING', color: 'text-amber-400' },
  correlating: { label: 'CORRELATING', color: 'text-purple-400' },
  concluded: { label: 'CONCLUDED', color: 'text-green-400' },
};

export default function AgentBanner({ state }: AgentBannerProps) {
  const phase = PHASE_LABELS[state.phase];

  return (
    <div className="glass-panel px-4 py-3 flex items-center gap-6">
      {/* Phase badge */}
      <div className="flex-shrink-0">
        <div className={`text-[10px] font-mono font-semibold tracking-widest ${phase.color}`}>
          ● {phase.label}
        </div>
      </div>

      {/* Objective */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">
          Objective
        </div>
        <div className="text-xs text-zinc-300 truncate">
          {state.objective}
        </div>
      </div>

      {/* Reasoning */}
      <div className="flex-1 min-w-0 hidden lg:block">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">
          Reasoning
        </div>
        <div className="text-xs text-zinc-400 truncate">
          {state.reasoning}
        </div>
      </div>

      {/* Current Tool */}
      {state.currentTool && (
        <div className="flex-shrink-0 hidden md:block">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">
            Active Tool
          </div>
          <div className="text-xs text-cyan-400 font-mono">
            {state.currentTool}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="flex-shrink-0 text-right">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">
          Confidence
        </div>
        <div className={`text-lg font-mono font-bold ${
          state.confidence >= 80 ? 'text-green-400' :
          state.confidence >= 50 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {state.confidence}%
        </div>
      </div>
    </div>
  );
}
