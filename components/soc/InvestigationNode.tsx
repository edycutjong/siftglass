'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeStatus } from '@/lib/types';

interface InvestigationNodeData {
  label: string;
  nodeType: string;
  status: NodeStatus;
  confidence: number;
  details: string;
}

const TYPE_ICONS: Record<string, string> = {
  ip: '🌐',
  domain: '🔗',
  hash: '🔑',
  process: '⚙️',
  file: '📄',
  user: '👤',
  network: '🛜',
};

const STATUS_STYLES: Record<NodeStatus, string> = {
  investigating: 'border-cyan-500 pulse-cyan',
  malicious: 'border-red-500 glow-red bg-red-950/30',
  benign: 'border-green-500/50',
  shattered: 'border-slate-600 shattered',
};

function InvestigationNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as InvestigationNodeData;
  const { label, nodeType, status, confidence, details } = nodeData;

  return (
    <div
      className={`relative px-4 py-3 rounded-lg border-2 bg-zinc-900/90 backdrop-blur-sm min-w-[180px] max-w-[220px] transition-all ${STATUS_STYLES[status]}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-600 !border-zinc-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-zinc-600 !border-zinc-500 !w-2 !h-2" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{TYPE_ICONS[nodeType] || '❓'}</span>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          {nodeType}
        </span>
      </div>

      {/* Label */}
      <div className="font-mono text-sm font-medium text-white truncate mb-1.5">
        {label}
      </div>

      {/* Confidence bar */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'malicious'
                ? 'bg-red-500'
                : status === 'investigating'
                  ? 'bg-cyan-500'
                  : status === 'shattered'
                    ? 'bg-zinc-600'
                    : 'bg-green-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{confidence}%</span>
      </div>

      {/* Details */}
      <div className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
        {details}
      </div>

      {/* Status indicator */}
      {status === 'malicious' && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
      )}
      {status === 'investigating' && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
      )}
    </div>
  );
}

export default memo(InvestigationNodeComponent);
