'use client';

import { useMemo, useState, useCallback, useEffect, useRef, Component, ReactNode } from 'react';
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
  ReactFlowProvider,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { VPSPageNode, PageGroup, GROUP_COLORS, GROUP_LABELS, TenantInfo } from '@/lib/vps-dashboard/types';
import PageNode from './canvas/nodes/PageNode';
import TenantNode from './canvas/nodes/TenantNode';
import SystemNode from './canvas/nodes/SystemNode';

// Error boundary to catch React errors
class PagesCanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PagesCanvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-slate-900 text-white p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PagesCanvasProps {
  pages: VPSPageNode[];
  onPageSelect: (page: VPSPageNode) => void;
  selectedPageId?: string;
  tenants?: TenantInfo[];
}

const nodeTypes = {
  page: PageNode,
  tenant: TenantNode,
  system: SystemNode,
} as const;

const POSITIONS_STORAGE_KEY = 'vps-pages-positions-v2';

function loadSavedPositions(): Record<string, { x: number; y: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(POSITIONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function savePositions(nodes: Node[]) {
  if (typeof window === 'undefined') return;
  try {
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach(node => {
      positions[node.id] = { x: node.position.x, y: node.position.y };
    });
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {
    console.error('Failed to save node positions:', e);
  }
}

function PagesCanvasInner({ pages, onPageSelect, selectedPageId, tenants = [] }: PagesCanvasProps) {
  const [viewMode, setViewMode] = useState<'tenants' | 'pages' | 'all'>('tenants');
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const savedPositions = useRef<Record<string, { x: number; y: number }>>(loadSavedPositions());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getPosition = (id: string, defaultPos: { x: number; y: number }) => {
    return savedPositions.current[id] || defaultPos;
  };

  // Group pages by route prefix
  const pagesByRoute = useMemo(() => {
    const groups: Record<string, VPSPageNode[]> = {};
    for (const page of pages) {
      const prefix = page.route.split('/')[1] || 'root';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(page);
    }
    return groups;
  }, [pages]);

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

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if ((viewMode === 'tenants' || viewMode === 'all') && tenants.length > 0) {
      // Central hub node
      nodes.push({
        id: 'hub',
        type: 'system',
        position: getPosition('hub', { x: 400, y: 50 }),
        data: {
          label: 'Alessa Cloud',
          type: 'internet',
          icon: '☁️',
          status: 'healthy',
          stats: { tenants: `${tenants.length} tenants` },
          color: '#8b5cf6',
          onClick: () => {},
        },
      });

      // Tenant nodes in a semi-circle
      const tenantRadius = 280;
      const startAngle = Math.PI * 0.2;
      const endAngle = Math.PI * 0.8;
      const angleStep = tenants.length > 1 ? (endAngle - startAngle) / (tenants.length - 1) : 0;

      tenants.forEach((tenant, idx) => {
        const angle = tenants.length > 1 ? startAngle + idx * angleStep : Math.PI * 0.5;
        const x = 400 + Math.cos(angle) * tenantRadius * 1.5;
        const y = 200 + Math.sin(angle) * tenantRadius;

        const tenantId = `tenant-${tenant.slug}`;
        nodes.push({
          id: tenantId,
          type: 'tenant',
          position: getPosition(tenantId, { x, y }),
          data: {
            tenant,
            isSubTenant: false,
            isSelected: selectedTenant?.id === tenant.id,
            onClick: () => setSelectedTenant(tenant),
          },
        });

        // Edge from hub to tenant
        edges.push({
          id: `e-hub-${tenantId}`,
          source: 'hub',
          target: tenantId,
          animated: true,
          style: { stroke: tenant.primaryColor || '#8b5cf6', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: tenant.primaryColor || '#8b5cf6',
          },
        });

        // Sub-tenants
        if (tenant.subTenants && tenant.subTenants.length > 0) {
          tenant.subTenants.forEach((sub, subIdx) => {
            const subAngle = angle + (subIdx - (tenant.subTenants.length - 1) / 2) * 0.3;
            const subX = x + Math.cos(subAngle) * 180;
            const subY = y + 180;

            const subId = `subtenant-${sub.slug}`;
            nodes.push({
              id: subId,
              type: 'tenant',
              position: getPosition(subId, { x: subX, y: subY }),
              data: {
                tenant: sub,
                isSubTenant: true,
                onClick: () => {},
              },
            });

            edges.push({
              id: `e-${tenantId}-${subId}`,
              source: tenantId,
              target: subId,
              animated: false,
              style: {
                stroke: sub.primaryColor || tenant.primaryColor || '#64748b',
                strokeWidth: 1.5,
                strokeDasharray: '5,5',
              },
            });
          });
        }
      });
    }

    if (viewMode === 'pages' || viewMode === 'all') {
      // Page groups as system nodes
      const routeGroups = Object.entries(pagesByRoute);
      const pagesStartY = viewMode === 'all' ? 500 : 50;
      const groupSpacing = 300;

      // Create page group nodes
      routeGroups.forEach(([prefix, groupPages], groupIdx) => {
        const groupX = 100 + (groupIdx % 4) * groupSpacing;
        const groupY = pagesStartY + Math.floor(groupIdx / 4) * 400;

        const primaryGroup = groupPages[0]?.group || 'public';
        const groupColor = GROUP_COLORS[primaryGroup];
        const groupId = `pagegroup-${prefix}`;

        nodes.push({
          id: groupId,
          type: 'system',
          position: getPosition(groupId, { x: groupX, y: groupY }),
          data: {
            label: `/${prefix}`,
            type: 'pages',
            icon: prefix === 'admin' ? '⚙️' : prefix === 'order' ? '🛒' : prefix === 'customer' ? '👤' : '📄',
            status: 'healthy',
            stats: { pages: `${groupPages.length} pages` },
            color: groupColor,
            onClick: () => {},
          },
        });

        // Pages under each group
        groupPages.forEach((page, pageIdx) => {
          const pageX = groupX + 200 + (pageIdx % 3) * 200;
          const pageY = groupY + Math.floor(pageIdx / 3) * 140;

          nodes.push({
            id: page.id,
            type: 'page',
            position: getPosition(page.id, { x: pageX, y: pageY }),
            data: {
              page,
              isSelected: page.id === selectedPageId,
              onClick: () => onPageSelect(page),
            },
          });

          edges.push({
            id: `e-${groupId}-${page.id}`,
            source: groupId,
            target: page.id,
            style: { stroke: GROUP_COLORS[page.group], strokeWidth: 1, opacity: 0.5 },
          });
        });
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [viewMode, tenants, pages, pagesByRoute, selectedTenant, selectedPageId, onPageSelect, getPosition]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update when view mode changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Save positions on drag end
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    const hasDragEnd = changes.some(
      change => change.type === 'position' && 'dragging' in change && change.dragging === false
    );

    if (hasDragEnd) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setNodes(currentNodes => {
          savePositions(currentNodes);
          return currentNodes;
        });
      }, 300);
    }
  }, [onNodesChange, setNodes]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const resetPositions = useCallback(() => {
    localStorage.removeItem(POSITIONS_STORAGE_KEY);
    window.location.reload();
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header with view mode toggle */}
      <div className="flex-shrink-0 p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* View mode buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 mr-2">View:</span>
            {[
              { id: 'tenants', label: 'Tenants', icon: '🏪' },
              { id: 'pages', label: 'Pages', icon: '📄' },
              { id: 'all', label: 'All', icon: '🗺️' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as typeof viewMode)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                  viewMode === mode.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                }`}
              >
                <span>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Stats summary */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              <span className="text-white font-medium">{tenants.length}</span> Tenants
            </span>
            <span className="text-slate-400">
              <span className="text-white font-medium">{pages.length}</span> Pages
            </span>
            <button
              onClick={resetPositions}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
            >
              Reset Layout
            </button>
          </div>
        </div>

        {/* Page group filters (only in pages/all view) */}
        {(viewMode === 'pages' || viewMode === 'all') && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {(Object.keys(GROUP_LABELS) as PageGroup[]).map((group) => {
              const count = groupStats[group];
              if (count === 0) return null;

              return (
                <span
                  key={group}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${GROUP_COLORS[group]}20`,
                    color: GROUP_COLORS[group],
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: GROUP_COLORS[group] }}
                  />
                  {GROUP_LABELS[group]}: {count}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        {/* Empty State for Tenants */}
        {viewMode === 'tenants' && tenants.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Tenants Found</h3>
              <p className="text-slate-400 mb-4">
                Tenants will appear here once they are created in the database.
              </p>
              <button
                onClick={() => setViewMode('pages')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                View Pages Instead
              </button>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          className="bg-slate-900"
          nodesDraggable={true}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={30} size={1} />
          <Controls className="bg-slate-800 border-slate-700 [&>button]:bg-slate-700 [&>button]:border-slate-600 [&>button]:text-white [&>button:hover]:bg-slate-600" />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'tenant') {
                const data = node.data as { tenant?: { primaryColor?: string } };
                return data?.tenant?.primaryColor || '#64748b';
              }
              if (node.type === 'system') {
                const data = node.data as { color?: string };
                return data?.color || '#64748b';
              }
              if (node.type === 'page') {
                const data = node.data as { page?: VPSPageNode };
                if (data?.page) {
                  return GROUP_COLORS[data.page.group];
                }
              }
              return '#64748b';
            }}
            className="bg-slate-800 border-slate-700"
            maskColor="rgba(15, 23, 42, 0.8)"
          />
        </ReactFlow>

        {/* Info Panel */}
        <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 p-4 max-w-xs">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            {viewMode === 'tenants' && <><span>🏪</span> Tenant Ecosystem</>}
            {viewMode === 'pages' && <><span>📄</span> Application Pages</>}
            {viewMode === 'all' && <><span>🗺️</span> Full Overview</>}
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            {viewMode === 'tenants' && 'Your multi-tenant architecture. Click a tenant to see details. Sub-tenants shown with dashed connections.'}
            {viewMode === 'pages' && 'All application pages grouped by route. Click a page for details.'}
            {viewMode === 'all' && 'Complete view of tenants and pages. Drag to rearrange.'}
          </p>

          {viewMode === 'tenants' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-400">Live tenant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-slate-400">Pending review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-slate-400" />
                <span className="text-slate-400">Sub-tenant</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Tenant Panel */}
        {selectedTenant && viewMode === 'tenants' && (
          <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                {selectedTenant.logoUrl ? (
                  <img src={selectedTenant.logoUrl} className="w-6 h-6 rounded" alt="" />
                ) : (
                  <span>🏪</span>
                )}
                {selectedTenant.name}
              </h3>
              <button
                onClick={() => setSelectedTenant(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="text-slate-400">Menu Items</div>
                  <div className="text-xl font-bold text-white">{selectedTenant.menuItemCount}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="text-slate-400">Orders</div>
                  <div className="text-xl font-bold text-white">{selectedTenant.orderCount}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="text-slate-400">Customers</div>
                  <div className="text-xl font-bold text-white">{selectedTenant.customerCount}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="text-slate-400">Sections</div>
                  <div className="text-xl font-bold text-white">{selectedTenant.menuSectionCount}</div>
                </div>
              </div>

              {selectedTenant.domain && (
                <div className="text-xs">
                  <span className="text-slate-400">Domain: </span>
                  <span className="text-blue-400 font-mono">{selectedTenant.domain}</span>
                </div>
              )}
              {selectedTenant.customDomain && (
                <div className="text-xs">
                  <span className="text-slate-400">Custom: </span>
                  <span className="text-green-400 font-mono">{selectedTenant.customDomain}</span>
                </div>
              )}

              {selectedTenant.subTenants.length > 0 && (
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">Sub-tenants:</div>
                  <div className="space-y-1">
                    {selectedTenant.subTenants.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between text-xs bg-slate-700/30 rounded px-2 py-1">
                        <span className="text-white">{sub.name}</span>
                        <span className="text-slate-400">{sub.menuItemCount} items</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color bar */}
              <div
                className="h-2 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${selectedTenant.primaryColor || '#3b82f6'}, ${selectedTenant.secondaryColor || selectedTenant.primaryColor || '#3b82f6'})`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div className="flex-shrink-0 p-3 bg-slate-800/50 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Drag nodes to rearrange</span>
            <span>•</span>
            <span>Click to select</span>
            <span>•</span>
            <span>Scroll to zoom</span>
          </div>
          <div>
            Layout auto-saved
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagesCanvas(props: PagesCanvasProps) {
  return (
    <PagesCanvasErrorBoundary>
      <ReactFlowProvider>
        <PagesCanvasInner {...props} />
      </ReactFlowProvider>
    </PagesCanvasErrorBoundary>
  );
}
