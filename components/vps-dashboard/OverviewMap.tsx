'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SystemOverview, PageGroup, SYSTEM_COLORS } from '@/lib/vps-dashboard/types';
import SystemNode from './canvas/nodes/SystemNode';

interface OverviewMapProps {
  system: SystemOverview;
  pageStats: {
    total: number;
    byGroup: Record<PageGroup, number>;
  };
  onNavigate: (target: 'nginx' | 'pm2' | 'postgres' | 'redis' | 'pages') => void;
}

const nodeTypes = {
  system: SystemNode,
} as const;

export default function OverviewMap({ system, pageStats, onNavigate }: OverviewMapProps) {
  const initialNodes: Node[] = useMemo(() => [
    // Internet Cloud
    {
      id: 'internet',
      type: 'system',
      position: { x: 400, y: 0 },
      data: {
        label: 'Internet',
        type: 'internet',
        icon: '🌐',
        status: 'healthy',
        stats: { requests: '~142/min' },
        color: '#fbbf24',
        onClick: () => {},
      },
    },
    // Nginx Gateway
    {
      id: 'nginx',
      type: 'system',
      position: { x: 400, y: 120 },
      data: {
        label: 'Nginx',
        type: 'nginx',
        icon: '🛡️',
        status: system.nginx.status === 'running' ? 'healthy' : 'error',
        stats: {
          sites: `${system.nginx.sites.length} sites`,
          ssl: 'Active',
        },
        color: SYSTEM_COLORS.nginx,
        onClick: () => onNavigate('nginx'),
      },
    },
    // Tenant Nodes
    ...system.nginx.sites.slice(0, 4).map((site, i) => ({
      id: `site-${i}`,
      type: 'system',
      position: { x: 100 + i * 200, y: 240 },
      data: {
        label: site.domain.split('.')[0],
        type: 'tenant' as const,
        icon: '🏪',
        status: site.status,
        stats: { domain: site.domain },
        color: '#10b981',
        onClick: () => {},
      },
    })),
    // PM2 Hub
    {
      id: 'pm2',
      type: 'system',
      position: { x: 400, y: 380 },
      data: {
        label: 'PM2',
        type: 'pm2',
        icon: '⚡',
        status: system.pm2.apps.some(a => a.status !== 'online') ? 'warning' : 'healthy',
        stats: {
          apps: `${system.pm2.apps.length} apps`,
          memory: system.pm2.totalMemory,
        },
        color: SYSTEM_COLORS.pm2,
        onClick: () => onNavigate('pm2'),
      },
    },
    // App instances
    ...system.pm2.apps.map((app, i) => ({
      id: `app-${i}`,
      type: 'system',
      position: { x: 200 + i * 400, y: 500 },
      data: {
        label: app.name,
        type: 'pm2' as const,
        icon: app.status === 'online' ? '✅' : '❌',
        status: app.status === 'online' ? 'healthy' : 'error',
        stats: {
          port: `:${app.port}`,
          mem: app.memory,
          restarts: app.restarts,
        },
        color: SYSTEM_COLORS.pm2,
        onClick: () => onNavigate('pm2'),
      },
    })),
    // PostgreSQL
    {
      id: 'postgres',
      type: 'system',
      position: { x: 200, y: 640 },
      data: {
        label: 'PostgreSQL',
        type: 'postgres',
        icon: '🐘',
        status: system.postgres.status === 'running' ? 'healthy' : 'error',
        stats: {
          version: system.postgres.version,
          dbs: `${system.postgres.databases.length} DBs`,
          conn: `${system.postgres.connections}/${system.postgres.maxConnections}`,
        },
        color: SYSTEM_COLORS.postgres,
        onClick: () => onNavigate('postgres'),
      },
    },
    // Redis
    {
      id: 'redis',
      type: 'system',
      position: { x: 600, y: 640 },
      data: {
        label: 'Redis',
        type: 'redis',
        icon: '🔴',
        status: system.redis.status === 'running' ? 'healthy' : 'error',
        stats: {
          keys: `${system.redis.keys} keys`,
          memory: system.redis.memory,
        },
        color: SYSTEM_COLORS.redis,
        onClick: () => onNavigate('redis'),
      },
    },
    // Pages Overview
    {
      id: 'pages',
      type: 'system',
      position: { x: 750, y: 380 },
      data: {
        label: 'Pages',
        type: 'pages' as const,
        icon: '📄',
        status: 'healthy',
        stats: {
          total: `${pageStats.total} pages`,
          admin: `${pageStats.byGroup.admin} admin`,
          public: `${pageStats.byGroup.public} public`,
        },
        color: '#06b6d4',
        onClick: () => onNavigate('pages'),
      },
    },
  ], [system, pageStats, onNavigate]);

  const initialEdges: Edge[] = useMemo(() => [
    // Internet to Nginx
    {
      id: 'e-internet-nginx',
      source: 'internet',
      target: 'nginx',
      animated: true,
      style: { stroke: '#fbbf24', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' },
    },
    // Nginx to Sites
    ...system.nginx.sites.slice(0, 4).map((_, i) => ({
      id: `e-nginx-site-${i}`,
      source: 'nginx',
      target: `site-${i}`,
      animated: true,
      style: { stroke: '#22c55e', strokeWidth: 1.5 },
    })),
    // Sites to PM2
    ...system.nginx.sites.slice(0, 4).map((_, i) => ({
      id: `e-site-${i}-pm2`,
      source: `site-${i}`,
      target: 'pm2',
      style: { stroke: '#334155', strokeWidth: 1 },
    })),
    // PM2 to Apps
    ...system.pm2.apps.map((_, i) => ({
      id: `e-pm2-app-${i}`,
      source: 'pm2',
      target: `app-${i}`,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 1.5 },
    })),
    // Apps to Postgres
    ...system.pm2.apps.map((_, i) => ({
      id: `e-app-${i}-postgres`,
      source: `app-${i}`,
      target: 'postgres',
      style: { stroke: '#8b5cf6', strokeWidth: 1 },
    })),
    // Apps to Redis
    ...system.pm2.apps.map((_, i) => ({
      id: `e-app-${i}-redis`,
      source: `app-${i}`,
      target: 'redis',
      style: { stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '5,5' },
    })),
    // PM2 to Pages
    {
      id: 'e-pm2-pages',
      source: 'pm2',
      target: 'pages',
      style: { stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '3,3' },
    },
  ], [system]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        className="bg-slate-900"
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="bg-slate-800 border-slate-700 [&>button]:bg-slate-700 [&>button]:border-slate-600 [&>button]:text-white [&>button:hover]:bg-slate-600" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { color?: string };
            return data?.color || '#64748b';
          }}
          className="bg-slate-800 border-slate-700"
          maskColor="rgba(15, 23, 42, 0.8)"
        />
      </ReactFlow>

      {/* Educational Overlay */}
      <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 max-w-xs border border-slate-700">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <span>🗺️</span> System Overview
        </h3>
        <p className="text-sm text-slate-400 mb-3">
          This is your VPS architecture. Click on any component to explore its office and learn more.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> Healthy
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" /> Warning
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full" /> Error
          </span>
        </div>
      </div>

      {/* Data Flow Legend */}
      <div className="absolute bottom-20 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
        <h4 className="text-xs font-semibold text-slate-400 mb-2">Data Flow</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-yellow-500" />
            <span className="text-slate-400">HTTP Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500" />
            <span className="text-slate-400">App Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-purple-500" />
            <span className="text-slate-400">Database Queries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500 border-dashed border-t" style={{ borderStyle: 'dashed' }} />
            <span className="text-slate-400">Cache Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
