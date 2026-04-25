'use client';

import { useEffect, useRef, useState } from 'react';
import { TerminalLine } from '@/lib/types';

interface TerminalPanelProps {
  lines: TerminalLine[];
}

const TYPE_COLORS: Record<TerminalLine['type'], string> = {
  info: 'text-zinc-300',
  warning: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-green-400',
  agent: 'text-cyan-400',
};

const TYPE_PREFIX: Record<TerminalLine['type'], string> = {
  info: 'INFO',
  warning: 'WARN',
  error: 'ALRT',
  success: ' OK ',
  agent: 'AGNT',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function TerminalPanel({ lines }: TerminalPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="glass-panel flex flex-col h-full border border-cyan-500/20" style={{ boxShadow: 'inset 0 0 20px rgba(6,182,212,0.05)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-500/20 bg-cyan-950/20">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>
        <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-widest" style={{ textShadow: '0 0 10px rgba(6,182,212,0.4)' }}>
          Investigation Terminal
        </span>
      </div>

      {/* Log lines */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 terminal-text bg-[#030712]/50">
        {lines.map((line) => (
          <div key={line.id} className="flex gap-2 leading-relaxed">
            <span className="text-zinc-500 flex-shrink-0">
              {mounted ? formatTime(line.timestamp) : '--:--:--'}
            </span>
            <span className={`flex-shrink-0 ${TYPE_COLORS[line.type]} font-bold`}>
              [{TYPE_PREFIX[line.type]}]
            </span>
            <span className={TYPE_COLORS[line.type]}>
              {line.content}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
