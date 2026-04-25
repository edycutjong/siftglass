'use client';

import { AgentState } from '@/lib/types';

interface AgentBannerProps {
  state: AgentState;
}

const PHASE_LABELS: Record<AgentState['phase'], { label: string; color: string; shadow: string }> = {
  scanning: { label: 'SCANNING', color: 'text-cyan-400', shadow: 'rgba(6,182,212,0.5)' },
  investigating: { label: 'INVESTIGATING', color: 'text-amber-400', shadow: 'rgba(251,191,36,0.5)' },
  correlating: { label: 'CORRELATING', color: 'text-purple-400', shadow: 'rgba(192,132,252,0.5)' },
  concluded: { label: 'CONCLUDED', color: 'text-green-400', shadow: 'rgba(74,222,128,0.5)' },
};

export default function AgentBanner({ state }: AgentBannerProps) {
  const phase = PHASE_LABELS[state.phase];

  return (
    <div className="glass-panel px-5 py-4 flex items-center gap-6 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-transparent shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
      {/* Phase badge */}
      <div className="flex-shrink-0">
        <div 
          className={`text-[12px] font-mono font-bold tracking-widest ${phase.color}`}
          style={{ textShadow: `0 0 12px ${phase.shadow}` }}
        >
          <span className="mr-2 animate-pulse">●</span>
          {phase.label}
        </div>
      </div>

      {/* Objective */}
      <div className="flex-1 min-w-0 border-l border-white/10 pl-6">
        <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest mb-1 font-bold" style={{ textShadow: '0 0 10px rgba(6,182,212,0.3)' }}>
          Objective
        </div>
        <div className="text-sm text-white font-medium truncate drop-shadow-md">
          {state.objective}
        </div>
      </div>

      {/* Reasoning */}
      <div className="flex-1 min-w-0 hidden lg:block border-l border-white/10 pl-6">
        <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest mb-1 font-bold" style={{ textShadow: '0 0 10px rgba(6,182,212,0.3)' }}>
          Reasoning
        </div>
        <div className="text-sm text-zinc-300 truncate drop-shadow-md">
          {state.reasoning}
        </div>
      </div>

      {/* Current Tool */}
      {state.currentTool && (
        <div className="flex-shrink-0 hidden md:block border-l border-white/10 pl-6">
          <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest mb-1 font-bold" style={{ textShadow: '0 0 10px rgba(6,182,212,0.3)' }}>
            Active Tool
          </div>
          <div className="text-sm text-cyan-400 font-mono font-bold drop-shadow-md">
            {state.currentTool}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="flex-shrink-0 text-right border-l border-white/10 pl-6">
        <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest mb-1 font-bold" style={{ textShadow: '0 0 10px rgba(6,182,212,0.3)' }}>
          Confidence
        </div>
        <div 
          className={`text-2xl font-mono font-extrabold ${
            state.confidence >= 80 ? 'text-green-400' :
            state.confidence >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}
          style={{ textShadow: `0 0 15px ${state.confidence >= 80 ? 'rgba(74,222,128,0.4)' : state.confidence >= 50 ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)'}` }}
        >
          {state.confidence}%
        </div>
      </div>
    </div>
  );
}
