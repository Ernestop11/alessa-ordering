'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
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
  groupHeader: GroupHeaderNode,
} as const;

// Group header node component
function GroupHeaderNode({ data }: { data: { label: string; count: number; color: string } }) {
  return (
    <div
      className="px-4 py-2 rounded-lg border-2 bg-slate-800/80 backdrop-blur-sm"
      style={{ borderColor: data.color }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-semibold text-white text-sm">{data.label}</span>
        <span className="text-xs text-slate-400">({data.count} pages)</span>
      </div>
    </div>
  );
}

// Storage key for position persistence
const POSITIONS_STORAGE_KEY = 'vps-pages-positions';

// Build route tree structure
interface RouteTreeNode {
  segment: string;
  fullPath: string;
  pages: VPSPageNode[];
  children: Map<string, RouteTreeNode>;
  depth: number;
}

function buildRouteTree(pages: VPSPageNode[]): Map<string, RouteTreeNode> {
  const tree = new Map<string, RouteTreeNode>();

  for (const page of pages) {
    const segments = page.route.split('/').filter(Boolean);
    if (segments.length === 0) {
      // Root page
      if (!tree.has('root')) {
        tree.set('root', {
          segment: '/',
          fullPath: '/',
          pages: [],
          children: new Map(),
          depth: 0,
        });
      }
      tree.get('root')!.pages.push(page);
      continue;
    }

    const topLevel = segments[0];
    if (!tree.has(topLevel)) {
      tree.set(topLevel, {
        segment: topLevel,
        fullPath: `/${topLevel}`,
        pages: [],
        children: new Map(),
        depth: 0,
      });
    }

    let current = tree.get(topLevel)!;

    if (segments.length === 1) {
      current.pages.push(page);
    } else {
      // Navigate to or create nested path
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        if (!current.children.has(segment)) {
          current.children.set(segment, {
            segment,
            fullPath: '/' + segments.slice(0, i + 1).join('/'),
            pages: [],
            children: new Map(),
            depth: i,
          });
        }
        current = current.children.get(segment)!;

        if (i === segments.length - 1) {
          current.pages.push(page);
        }
      }
    }
  }

  return tree;
}

// Flatten tree for layout
function flattenTree(
  tree: Map<string, RouteTreeNode>,
  parentId: string | null = null,
  depth: number = 0
): Array<{ node: RouteTreeNode; parentId: string | null; depth: number }> {
  const result: Array<{ node: RouteTreeNode; parentId: string | null; depth: number }> = [];

  Array.from(tree.entries()).forEach(([key, node]) => {
    result.push({ node, parentId, depth });
    if (node.children.size > 0) {
      result.push(...flattenTree(node.children, node.fullPath, depth + 1));
    }
  });

  return result;
}

function PagesCanvasInner({ pages, onPageSelect, selectedPageId }: PagesCanvasProps) {
  const [activeFilter, setActiveFilter] = useState<PageGroup | 'all'>('all');
  const { fitView } = useReactFlow();

  const filteredPages = useMemo(() => {
    if (activeFilter === 'all') return pages;
    return pages.filter(p => p.group === activeFilter);
  }, [pages, activeFilter]);

  // Load saved positions
  const savedPositions = useMemo(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(POSITIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  // Build hierarchical layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const routeTree = buildRouteTree(filteredPages);
    const flatTree = flattenTree(routeTree);

    // Group pages by their top-level route for color coding
    const getGroupColor = (route: string): string => {
      const page = filteredPages.find(p => p.route === route);
      if (page) return GROUP_COLORS[page.group];

      // Find any page under this route
      const childPage = filteredPages.find(p => p.route.startsWith(route));
      if (childPage) return GROUP_COLORS[childPage.group];

      return '#64748b';
    };

    // Layout constants
    const HEADER_WIDTH = 200;
    const PAGE_WIDTH = 180;
    const PAGE_HEIGHT = 120;
    const HORIZONTAL_GAP = 60;
    const VERTICAL_GAP = 40;
    const GROUP_GAP = 100;

    let currentY = 50;
    const processedGroups = new Map<string, { y: number; pageCount: number }>();

    // First pass: create group headers and calculate positions
    for (const { node, parentId, depth } of flatTree) {
      const groupId = `group-${node.fullPath}`;
      const color = getGroupColor(node.fullPath);

      // Only create group headers for routes with pages or children
      if (node.pages.length > 0 || node.children.size > 0) {
        const savedPos = savedPositions[groupId];
        const headerX = depth * (PAGE_WIDTH + HORIZONTAL_GAP);

        nodes.push({
          id: groupId,
          type: 'groupHeader',
          position: savedPos || { x: headerX, y: currentY },
          data: {
            label: node.fullPath,
            count: node.pages.length,
            color,
          },
          draggable: true,
        });

        // Add edge from parent group to this group
        if (parentId) {
          edges.push({
            id: `edge-${parentId}-${node.fullPath}`,
            source: `group-${parentId}`,
            target: groupId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: color, strokeWidth: 1.5, opacity: 0.4 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color,
              width: 15,
              height: 15,
            },
          });
        }

        processedGroups.set(node.fullPath, { y: currentY, pageCount: node.pages.length });

        // Add page nodes for this group
        let pageX = headerX + HEADER_WIDTH + HORIZONTAL_GAP;
        let pageY = currentY;
        const pagesPerRow = 4;

        node.pages.forEach((page, idx) => {
          const savedPagePos = savedPositions[page.id];
          const row = Math.floor(idx / pagesPerRow);
          const col = idx % pagesPerRow;

          nodes.push({
            id: page.id,
            type: 'page',
            position: savedPagePos || {
              x: pageX + col * (PAGE_WIDTH + 20),
              y: pageY + row * (PAGE_HEIGHT + 20),
            },
            data: {
              page,
              isSelected: page.id === selectedPageId,
              onClick: () => onPageSelect(page),
            },
            draggable: true,
          });

          // Edge from group header to page
          edges.push({
            id: `edge-${groupId}-${page.id}`,
            source: groupId,
            target: page.id,
            type: 'smoothstep',
            animated: false,
            style: { stroke: GROUP_COLORS[page.group], strokeWidth: 1, opacity: 0.3 },
          });
        });

        // Calculate space needed for this group
        const rowsNeeded = Math.ceil(node.pages.length / pagesPerRow);
        currentY += Math.max(PAGE_HEIGHT, rowsNeeded * (PAGE_HEIGHT + 20)) + GROUP_GAP;
      }
    }

    return { nodes, edges };
  }, [filteredPages, selectedPageId, onPageSelect, savedPositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when filter or selection changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => fitView({ padding: 0.15 }), 100);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  // Save positions on change
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);

      // Save positions after drag
      const positionChanges = changes.filter(
        (c: any) => c.type === 'position' && c.dragging === false
      );

      if (positionChanges.length > 0) {
        const currentPositions = { ...savedPositions };
        for (const change of positionChanges) {
          if (change.position) {
            currentPositions[change.id] = change.position;
          }
        }
        localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(currentPositions));
      }
    },
    [onNodesChange, savedPositions]
  );

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

  const resetPositions = useCallback(() => {
    localStorage.removeItem(POSITIONS_STORAGE_KEY);
    window.location.reload();
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Filter Bar */}
      <div className="flex-shrink-0 p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-2">
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

          <button
            onClick={resetPositions}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
          >
            Reset Layout
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
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
              if (node.type === 'groupHeader') {
                const data = node.data as { color?: string };
                return data?.color || '#64748b';
              }
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

        {/* Info Overlay */}
        <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 p-4 max-w-xs">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-lg">📄</span>
            Pages Hierarchy
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Pages organized by their route structure. Each route group shows its child pages.
          </p>
          <div className="space-y-1.5 text-xs">
            {(Object.keys(GROUP_LABELS) as PageGroup[]).map((group) => {
              const count = groupStats[group];
              if (count === 0) return null;
              return (
                <div key={group} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: GROUP_COLORS[group] }}
                  />
                  <span className="text-slate-300">{GROUP_LABELS[group]}</span>
                  <span className="text-slate-500 ml-auto">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
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

export default function PagesCanvas(props: PagesCanvasProps) {
  return (
    <ReactFlowProvider>
      <PagesCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
