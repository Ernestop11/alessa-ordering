'use client';

import { useState, useEffect } from 'react';

interface DownlineNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  rank: string;
  level: number;
  totalEarnings: number;
  totalRecruits: number;
  activeRecruits: number;
  totalSales: number;
  children?: DownlineNode[];
}

interface Props {
  associateId: string;
  maxDepth?: number;
}

const RANK_COLORS: Record<string, string> = {
  REP: 'bg-gray-100 text-gray-800 border-gray-300',
  SENIOR_REP: 'bg-blue-100 text-blue-800 border-blue-300',
  SUPERVISOR: 'bg-green-100 text-green-800 border-green-300',
  MANAGER: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SENIOR_MANAGER: 'bg-orange-100 text-orange-800 border-orange-300',
  DIRECTOR: 'bg-purple-100 text-purple-800 border-purple-300',
  SENIOR_DIRECTOR: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  VP: 'bg-pink-100 text-pink-800 border-pink-300',
  SVP: 'bg-red-100 text-red-800 border-red-300',
};

const RANK_ICONS: Record<string, string> = {
  REP: '⭐',
  SENIOR_REP: '🌟',
  SUPERVISOR: '🎖️',
  MANAGER: '🏅',
  SENIOR_MANAGER: '🥇',
  DIRECTOR: '👔',
  SENIOR_DIRECTOR: '💼',
  VP: '🎩',
  SVP: '👑',
};

export default function EnhancedDownlineTree({ associateId, maxDepth = 5 }: Props) {
  const [tree, setTree] = useState<DownlineNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([associateId]));
  const [filter, setFilter] = useState<'all' | 'active' | 'rank'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTree();
  }, [associateId]);

  const loadTree = async () => {
    try {
      const res = await fetch(`/api/mlm/downline?associateId=${associateId}`);
      if (res.ok) {
        const data = await res.json();
        setTree(data);
      }
    } catch (error) {
      console.error('Error loading tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: DownlineNode, depth: number = 0): JSX.Element | null => {
    if (depth > maxDepth) return null;

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const rankColor = RANK_COLORS[node.rank] || RANK_COLORS.REP;
    const rankIcon = RANK_ICONS[node.rank] || '⭐';

    // Filter logic
    if (filter === 'active' && node.activeRecruits === 0 && !hasChildren) return null;
    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !node.email.toLowerCase().includes(searchTerm.toLowerCase())) return null;

    return (
      <div key={node.id} className="ml-4">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border-2 ${rankColor} mb-2 hover:shadow-md transition cursor-pointer`}
          onClick={() => hasChildren && toggleNode(node.id)}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {hasChildren && (
            <button className="text-lg font-bold w-6 h-6 flex items-center justify-center">
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="text-2xl">{rankIcon}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{node.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rankColor}`}>
                {node.rank}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {node.email} • {node.referralCode}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="font-semibold">💰 ${node.totalEarnings.toFixed(2)}</span>
              <span className="font-semibold">👥 {node.totalRecruits} recruits</span>
              <span className="font-semibold">✅ {node.activeRecruits} active</span>
              <span className="font-semibold">📊 {node.totalSales} sales</span>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-4 border-l-2 border-gray-300 pl-2">
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No downline data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'active'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => {
              // Expand all
              const allIds = new Set<string>();
              const collectIds = (node: DownlineNode) => {
                allIds.add(node.id);
                node.children?.forEach(collectIds);
              };
              collectIds(tree);
              setExpandedNodes(allIds);
            }}
            className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm font-semibold transition"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedNodes(new Set([associateId]))}
            className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm font-semibold transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h4 className="font-bold text-gray-900">Your Team Structure</h4>
          <p className="text-sm text-gray-600 mt-1">
            Click on any team member to expand/collapse their downline
          </p>
        </div>
        {renderNode(tree)}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Rank Legend</h5>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
          {Object.entries(RANK_ICONS).map(([rank, icon]) => (
            <div key={rank} className="flex items-center gap-1">
              <span>{icon}</span>
              <span className="text-gray-700">{rank}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
