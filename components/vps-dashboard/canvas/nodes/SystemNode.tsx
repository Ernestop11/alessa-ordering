'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface SystemNodeData {
  label: string;
  type: string;
  icon: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  stats?: Record<string, string | number>;
  color: string;
  onClick?: () => void;
  focused?: boolean;
  mini?: boolean;
}

interface SystemNodeProps {
  data: SystemNodeData;
}

function SystemNode({ data }: SystemNodeProps) {
  const nodeData = data;
  const { label, icon, status, stats, color, onClick, focused, mini } = nodeData;

  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  // Mini mode for compact visualization
  if (mini) {
    return (
      <div
        onClick={onClick}
        className={`
          relative bg-slate-800 rounded-lg border-2 p-2 min-w-[80px]
          transition-all duration-200
          ${onClick ? 'cursor-pointer hover:scale-105' : ''}
          ${focused ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''}
        `}
        style={{
          borderColor: focused ? color : `${color}60`,
          boxShadow: focused ? `0 0 20px ${color}40` : 'none',
          '--tw-ring-color': color,
        } as React.CSSProperties}
      >
        <Handle type="target" position={Position.Left} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />
        <Handle type="source" position={Position.Right} className="!bg-slate-600 !border-slate-500 !w-2 !h-2" />

        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${statusColors[status]} ring-1 ring-slate-800`} />

        <div className="flex flex-col items-center text-center">
          <span className="text-lg">{icon}</span>
          <span className={`font-medium text-[10px] ${focused ? 'text-white' : 'text-slate-400'}`}>{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-slate-800 rounded-xl border-2 p-4 min-w-[140px]
        transition-all duration-200 cursor-pointer
        hover:scale-105 hover:shadow-lg hover:shadow-${color}/20
        ${onClick ? 'hover:border-opacity-100' : ''}
      `}
      style={{
        borderColor: color,
        boxShadow: `0 0 20px ${color}20`,
      }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-600 !border-slate-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-600 !border-slate-500 !w-3 !h-3"
      />

      {/* Status indicator */}
      <div
        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusColors[status]} ring-2 ring-slate-800`}
      />

      {/* Content */}
      <div className="flex flex-col items-center text-center">
        <span className="text-2xl mb-1">{icon}</span>
        <span className="font-semibold text-white text-sm">{label}</span>

        {stats && (
          <div className="mt-2 space-y-0.5">
            {Object.entries(stats).slice(0, 3).map(([key, value]) => (
              <div key={key} className="text-xs text-slate-400">
                <span className="text-slate-500">{key}:</span> {value}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click hint */}
      {onClick && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Click to explore
        </div>
      )}
    </div>
  );
}

export default memo(SystemNode);
