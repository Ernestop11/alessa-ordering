"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-d3-tree to avoid SSR issues
const Tree = dynamic(() => import('react-d3-tree'), { ssr: false });

interface MLMTreeData {
  name: string;
  attributes: {
    id: string;
    rank: string;
    totalRecruits: number;
    email: string;
  };
  children?: MLMTreeData[];
}

interface Props {
  initialTree?: MLMTreeData | null;
  stats?: {
    totalAssociates: number;
    totalRecruits: number;
    averageRank: number;
  };
}

export default function MLMCompanyTree({ initialTree, stats }: Props) {
  const [treeData, setTreeData] = useState<MLMTreeData | null>(initialTree || null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MLMTreeData | null>(null);

  useEffect(() => {
    if (!initialTree) {
      loadTree();
    }
  }, []);

  const loadTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/mlm/tree');
      if (res.ok) {
        const data = await res.json();
        setTreeData(data.tree);
      }
    } catch (error) {
      console.error('Error loading MLM tree:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-gray-500">Loading MLM tree...</p>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-gray-500">No MLM data available</p>
      </div>
    );
  }

  const treeConfig = {
    nodeSize: { x: 200, y: 100 },
    separation: { siblings: 1, nonSiblings: 2 },
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Total Associates</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalAssociates}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Total Recruits</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalRecruits}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Avg Rank</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.averageRank.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Tree Visualization */}
      <div className="relative h-96 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="absolute right-4 top-4 z-10 rounded-lg bg-white p-2 shadow-lg">
          <button
            onClick={loadTree}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="straight"
          translate={{ x: 400, y: 50 }}
          nodeSize={treeConfig.nodeSize}
          separation={treeConfig.separation}
          renderCustomNodeElement={(rd3tProps) => {
            const { nodeDatum } = rd3tProps;
            return (
              <g>
                <circle
                  r={20}
                  fill={nodeDatum.attributes?.rank === 'SVP' ? '#f59e0b' : '#3b82f6'}
                  stroke="#fff"
                  strokeWidth={2}
                  onClick={() => setSelectedNode(nodeDatum)}
                  className="cursor-pointer"
                />
                <text
                  x={0}
                  y={-30}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="12"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {nodeDatum.name}
                </text>
                <text
                  x={0}
                  y={-15}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  {nodeDatum.attributes?.rank || 'N/A'}
                </text>
              </g>
            );
          }}
        />
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
              <p className="mt-1 text-sm text-gray-600">{selectedNode.attributes?.email}</p>
              <p className="mt-1 text-sm text-gray-600">
                Rank: {selectedNode.attributes?.rank || 'N/A'} • Recruits:{' '}
                {selectedNode.attributes?.totalRecruits || 0}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

