'use client';

import { useEffect, useRef } from 'react';
import { TerminalLine } from '@/lib/types';

interface TerminalPanelProps {
  lines: TerminalLine[];
}

const TYPE_COLORS: Record<TerminalLine['type'], string> = {
  info: 'text-zinc-400',
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          Investigation Terminal
        </span>
      </div>

      {/* Log lines */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 terminal-text">
        {lines.map((line) => (
          <div key={line.id} className="flex gap-2 leading-relaxed">
            <span className="text-zinc-600 flex-shrink-0">
              {formatTime(line.timestamp)}
            </span>
            <span className={`flex-shrink-0 ${TYPE_COLORS[line.type]}`}>
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
