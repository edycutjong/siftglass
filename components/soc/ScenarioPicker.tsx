'use client';

import { useState, useRef, useEffect } from 'react';
import type { DemoScenario } from '@/lib/demo-data';

interface ScenarioPickerProps {
  scenarios: DemoScenario[];
  activeId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const SCENARIO_ICONS: Record<string, string> = {
  'supply-chain': '📦',
  'ransomware': '🔐',
  'credential-stuffing': '🔑',
  'insider-threat': '🕵️',
};

export default function ScenarioPicker({ scenarios, activeId, onSelect, disabled }: ScenarioPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = scenarios.find((s) => s.id === activeId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[12px] font-mono font-bold tracking-wide transition-all duration-300 ${
          disabled
            ? 'border-zinc-700/50 bg-zinc-800/30 text-zinc-500 cursor-not-allowed'
            : 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer'
        }`}
      >
        <span>{SCENARIO_ICONS[activeId] ?? '🔬'}</span>
        <span className="hidden sm:inline uppercase">{active?.title ?? 'Scenario'}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl border border-cyan-500/20 bg-[#0a0f1a]/95 backdrop-blur-xl shadow-[0_8px_40px_rgba(6,182,212,0.15)] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400/60 uppercase">
              Investigation Scenarios
            </span>
          </div>
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); setOpen(false); }}
              className={`w-full text-left px-4 py-3 transition-all duration-200 border-b border-white/5 last:border-b-0 ${
                s.id === activeId
                  ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                  : 'hover:bg-white/5 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{SCENARIO_ICONS[s.id] ?? '🔬'}</span>
                <div className="min-w-0">
                  <div className={`text-[13px] font-bold ${s.id === activeId ? 'text-cyan-300' : 'text-white'}`}>
                    {s.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate font-mono">
                    {s.description}
                  </div>
                </div>
                {s.id === activeId && (
                  <div className="ml-auto flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px rgba(6,182,212,0.8)' }} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
