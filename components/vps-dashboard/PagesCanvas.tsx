'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { VPSPageNode, PageGroup, GROUP_COLORS, GROUP_LABELS } from '@/lib/vps-dashboard/types';
import PageNode from './canvas/nodes/PageNode';

interface PagesCanvasProps {
  pages: VPSPageNode[];
  onPageSelect: (page: VPSPageNode) => void;
  selectedPageId?: string;
}

const nodeTypes = {
  page: PageNode,
} as const;

export default function PagesCanvas({ pages, onPageSelect, selectedPageId }: PagesCanvasProps) {
  const [activeFilter, setActiveFilter] = useState<PageGroup | 'all'>('all');

  const filteredPages = useMemo(() => {
    if (activeFilter === 'all') return pages;
    return pages.filter(p => p.group === activeFilter);
  }, [pages, activeFilter]);

  const initialNodes: Node[] = useMemo(() => {
    const groupCounts: Record<string, number> = {};

    return filteredPages.map((page) => {
      // Track position within group
      groupCounts[page.group] = (groupCounts[page.group] || 0) + 1;

      return {
        id: page.id,
        type: 'page',
        position: page.position,
        data: {
          page,
          isSelected: page.id === selectedPageId,
          onClick: () => onPageSelect(page),
        },
      };
    });
  }, [filteredPages, selectedPageId, onPageSelect]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Group statistics
  const groupStats = useMemo(() => {
    const stats: Record<PageGroup | 'all', number> = {
      all: pages.length,
      public: 0,
      admin: 0,
      'super-admin': 0,
      associate: 0,
      accountant: 0,
      customer: 0,
      auth: 0,
      test: 0,
    };

    for (const page of pages) {
      stats[page.group]++;
    }

    return stats;
  }, [pages]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Filter Bar */}
      <div className="flex-shrink-0 p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            All ({groupStats.all})
          </button>

          {(Object.keys(GROUP_LABELS) as PageGroup[]).map((group) => {
            const count = groupStats[group];
            if (count === 0) return null;

            return (
              <button
                key={group}
                onClick={() => setActiveFilter(group)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                  activeFilter === group
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: activeFilter === group ? GROUP_COLORS[group] : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: GROUP_COLORS[group] }}
                />
                {GROUP_LABELS[group]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={[]}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          className="bg-slate-900"
          nodesDraggable={true}
          nodesConnectable={false}
        >
          <Background color="#334155" gap={30} size={1} />
          <Controls className="bg-slate-800 border-slate-700 [&>button]:bg-slate-700 [&>button]:border-slate-600 [&>button]:text-white [&>button:hover]:bg-slate-600" />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { page?: VPSPageNode };
              if (data?.page) {
                return GROUP_COLORS[data.page.group];
              }
              return '#64748b';
            }}
            className="bg-slate-800 border-slate-700"
            maskColor="rgba(15, 23, 42, 0.8)"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 p-3 bg-slate-800/50 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-yellow-500 to-yellow-600" />
              Client Component
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-green-600" />
              Server Component
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-orange-500" />
              Auth Required
            </span>
          </div>
          <div className="text-slate-500">
            Drag to rearrange • Click to select • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}
