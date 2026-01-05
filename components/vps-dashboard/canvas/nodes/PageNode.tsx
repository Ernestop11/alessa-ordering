'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { VPSPageNode, GROUP_COLORS } from '@/lib/vps-dashboard/types';

interface PageNodeData {
  page: VPSPageNode;
  isSelected: boolean;
  onClick: () => void;
}

interface PageNodeProps {
  data: PageNodeData;
}

function PageNode({ data }: PageNodeProps) {
  const nodeData = data;
  const { page, isSelected, onClick } = nodeData;
  const groupColor = GROUP_COLORS[page.group];

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-slate-800 rounded-xl border-2 p-3 w-[180px]
        transition-all duration-200 cursor-pointer
        hover:scale-105 hover:shadow-xl
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
        ${page.requiresAuth ? 'border-dashed' : 'border-solid'}
      `}
      style={{
        borderColor: groupColor,
        boxShadow: isSelected ? `0 0 30px ${groupColor}40` : `0 0 15px ${groupColor}20`,
      }}
    >
      {/* Handle for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2 !opacity-0"
      />

      {/* Type indicator (client/server) */}
      <div
        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-slate-800 ${
          page.hasClientDirective ? 'bg-yellow-500' : 'bg-green-500'
        }`}
        title={page.hasClientDirective ? 'Client Component' : 'Server Component'}
      />

      {/* Auth indicator */}
      {page.requiresAuth && (
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-orange-500 rounded-full ring-2 ring-slate-800 flex items-center justify-center">
          <span className="text-[10px]">🔐</span>
        </div>
      )}

      {/* Content */}
      <div className="text-center">
        {/* Route */}
        <div className="font-mono text-sm font-semibold text-white mb-1 truncate" title={page.route}>
          {page.route || '/'}
        </div>

        {/* Component name */}
        <div className="text-xs text-slate-400 truncate mb-2" title={page.componentName}>
          {page.componentName}
        </div>

        {/* Group badge */}
        <span
          className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: `${groupColor}20`, color: groupColor }}
        >
          {page.group}
        </span>
      </div>

      {/* Preview mini-icon */}
      <div className="absolute bottom-1 right-1 text-xs opacity-50 hover:opacity-100 transition-opacity">
        👁️
      </div>
    </div>
  );
}

export default memo(PageNode);
