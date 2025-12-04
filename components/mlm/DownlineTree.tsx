'use client';

import { useState, useEffect } from 'react';

interface DownlineNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  level: number;
  totalEarnings: number;
  downlineCount: number;
  referralsCount: number;
  commissionsCount: number;
  children?: DownlineNode[];
}

interface Props {
  associateId: string;
}

export default function DownlineTree({ associateId }: Props) {
  const [tree, setTree] = useState<DownlineNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDownlineTree();
  }, [associateId]);

  const loadDownlineTree = async () => {
    try {
      const res = await fetch(`/api/mlm/downline?associateId=${associateId}`);
      if (res.ok) {
        const data = await res.json();
        setTree(data);
        // Auto-expand first level
        if (data?.id) {
          setExpandedNodes(new Set([data.id]));
        }
      }
    } catch (error) {
      console.error('Error loading downline:', error);
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

  const renderNode = (node: DownlineNode, depth: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        <div
          className={`flex items-center gap-4 p-4 rounded-lg border-2 transition ${
            depth === 0
              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
          style={{ marginLeft: `${depth * 2}rem` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
          {!hasChildren && <div className="w-8" />}

          {/* Node Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                {node.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{node.name}</h4>
                <p className="text-xs text-gray-500">{node.email}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold">Level:</span> {node.level}
              </span>
              <span className="text-gray-600">
                <span className="font-semibold">Earnings:</span> ${node.totalEarnings.toFixed(2)}
              </span>
              <span className="text-gray-600">
                <span className="font-semibold">Downline:</span> {node.downlineCount}
              </span>
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                {node.referralCode}
              </span>
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-2 space-y-2">
            {node.children!.map((child) => renderNode(child, depth + 1))}
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
      <div className="text-center py-12 text-gray-500">
        <p>No downline data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Total Downline:</span> {tree.downlineCount} associates
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-semibold">Total Referrals:</span> {tree.referralsCount} restaurants
        </p>
      </div>
      {renderNode(tree)}
    </div>
  );
}

