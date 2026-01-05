'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import SystemNode from './nodes/SystemNode';
import { SYSTEM_COLORS } from '@/lib/vps-dashboard/types';

type SystemType = 'nginx' | 'pm2' | 'postgres' | 'redis';
type ViewMode = 'overview' | 'pages' | 'apis' | 'nginx' | 'pm2' | 'postgres' | 'redis';

interface MiniFlowViewProps {
  focusedSystem: SystemType;
  systemData: {
    nginx?: { status: string; sitesCount: number };
    pm2?: { status: string; appsCount: number; apps?: { name: string; status: string }[] };
    postgres?: { status: string; dbCount: number };
    redis?: { status: string; keys: number };
  };
  onNavigate?: (target: ViewMode) => void;
  height?: string;
}

const nodeTypes = {
  system: SystemNode,
} as const;

export default function MiniFlowView({ focusedSystem, systemData, onNavigate, height = '280px' }: MiniFlowViewProps) {
  const nodes: Node[] = useMemo(() => {
    const baseNodes: Node[] = [];

    // Internet node (always shown)
    baseNodes.push({
      id: 'internet',
      type: 'system',
      position: { x: 50, y: 100 },
      data: {
        label: 'Internet',
        type: 'internet',
        icon: '🌐',
        status: 'healthy',
        stats: { requests: '~142/min' },
        color: '#fbbf24',
        onClick: () => {},
        mini: true,
      },
    });

    // Nginx node
    baseNodes.push({
      id: 'nginx',
      type: 'system',
      position: { x: 200, y: 100 },
      data: {
        label: 'Nginx',
        type: 'nginx',
        icon: '🛡️',
        status: systemData.nginx?.status === 'running' ? 'healthy' : 'error',
        stats: { sites: `${systemData.nginx?.sitesCount || 0}` },
        color: SYSTEM_COLORS.nginx,
        onClick: () => focusedSystem !== 'nginx' && onNavigate?.('nginx'),
        focused: focusedSystem === 'nginx',
        mini: true,
      },
    });

    // PM2 node
    baseNodes.push({
      id: 'pm2',
      type: 'system',
      position: { x: 350, y: 100 },
      data: {
        label: 'PM2',
        type: 'pm2',
        icon: '⚡',
        status: systemData.pm2?.status === 'running' ? 'healthy' : 'error',
        stats: { apps: `${systemData.pm2?.appsCount || 0}` },
        color: SYSTEM_COLORS.pm2,
        onClick: () => focusedSystem !== 'pm2' && onNavigate?.('pm2'),
        focused: focusedSystem === 'pm2',
        mini: true,
      },
    });

    // PostgreSQL node
    baseNodes.push({
      id: 'postgres',
      type: 'system',
      position: { x: 500, y: 50 },
      data: {
        label: 'PostgreSQL',
        type: 'postgres',
        icon: '🐘',
        status: systemData.postgres?.status === 'running' ? 'healthy' : 'error',
        stats: { dbs: `${systemData.postgres?.dbCount || 0}` },
        color: SYSTEM_COLORS.postgres,
        onClick: () => focusedSystem !== 'postgres' && onNavigate?.('postgres'),
        focused: focusedSystem === 'postgres',
        mini: true,
      },
    });

    // Redis node
    baseNodes.push({
      id: 'redis',
      type: 'system',
      position: { x: 500, y: 150 },
      data: {
        label: 'Redis',
        type: 'redis',
        icon: '🔴',
        status: systemData.redis?.status === 'running' ? 'healthy' : 'error',
        stats: { keys: `${systemData.redis?.keys || 0}` },
        color: SYSTEM_COLORS.redis,
        onClick: () => focusedSystem !== 'redis' && onNavigate?.('redis'),
        focused: focusedSystem === 'redis',
        mini: true,
      },
    });

    return baseNodes;
  }, [focusedSystem, systemData, onNavigate]);

  const edges: Edge[] = useMemo(() => {
    const baseEdges: Edge[] = [
      // Internet -> Nginx
      {
        id: 'e-internet-nginx',
        source: 'internet',
        target: 'nginx',
        animated: focusedSystem === 'nginx',
        style: {
          stroke: focusedSystem === 'nginx' ? '#22c55e' : '#334155',
          strokeWidth: focusedSystem === 'nginx' ? 2 : 1
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: focusedSystem === 'nginx' ? '#22c55e' : '#334155' },
      },
      // Nginx -> PM2
      {
        id: 'e-nginx-pm2',
        source: 'nginx',
        target: 'pm2',
        animated: focusedSystem === 'nginx' || focusedSystem === 'pm2',
        style: {
          stroke: (focusedSystem === 'nginx' || focusedSystem === 'pm2') ? '#3b82f6' : '#334155',
          strokeWidth: (focusedSystem === 'nginx' || focusedSystem === 'pm2') ? 2 : 1
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: (focusedSystem === 'nginx' || focusedSystem === 'pm2') ? '#3b82f6' : '#334155' },
      },
      // PM2 -> PostgreSQL
      {
        id: 'e-pm2-postgres',
        source: 'pm2',
        target: 'postgres',
        animated: focusedSystem === 'pm2' || focusedSystem === 'postgres',
        style: {
          stroke: (focusedSystem === 'pm2' || focusedSystem === 'postgres') ? '#8b5cf6' : '#334155',
          strokeWidth: (focusedSystem === 'pm2' || focusedSystem === 'postgres') ? 2 : 1
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: (focusedSystem === 'pm2' || focusedSystem === 'postgres') ? '#8b5cf6' : '#334155' },
      },
      // PM2 -> Redis
      {
        id: 'e-pm2-redis',
        source: 'pm2',
        target: 'redis',
        animated: focusedSystem === 'pm2' || focusedSystem === 'redis',
        style: {
          stroke: (focusedSystem === 'pm2' || focusedSystem === 'redis') ? '#ef4444' : '#334155',
          strokeWidth: (focusedSystem === 'pm2' || focusedSystem === 'redis') ? 2 : 1,
          strokeDasharray: '5,5',
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: (focusedSystem === 'pm2' || focusedSystem === 'redis') ? '#ef4444' : '#334155' },
      },
    ];

    return baseEdges;
  }, [focusedSystem]);

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.5}
        maxZoom={1.5}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        className="bg-slate-900"
      >
        <Background color="#334155" gap={16} size={1} />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-6 h-0.5 bg-slate-600" /> Inactive
        </span>
        <span className="flex items-center gap-1">
          <span className="w-6 h-0.5 bg-green-500 animate-pulse" /> Active Flow
        </span>
        <span className="text-slate-600">Click nodes to navigate</span>
      </div>
    </div>
  );
}
