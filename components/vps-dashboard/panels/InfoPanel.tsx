'use client';

import { VPSPageNode, GROUP_COLORS, GROUP_LABELS } from '@/lib/vps-dashboard/types';

interface InfoPanelProps {
  page: VPSPageNode;
  onClose: () => void;
  onPreview: () => void;
  onEditWithAider?: () => void;
}

export default function InfoPanel({ page, onClose, onPreview, onEditWithAider }: InfoPanelProps) {
  const groupColor = GROUP_COLORS[page.group];

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${groupColor}20`, color: groupColor }}
          >
            {GROUP_LABELS[page.group]}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <h3 className="font-bold text-lg text-white">{page.route || '/'}</h3>
        <p className="text-sm text-slate-400">{page.componentName}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Quick Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Type</span>
            <span className={`font-mono ${page.hasClientDirective ? 'text-yellow-400' : 'text-green-400'}`}>
              {page.hasClientDirective ? 'Client' : 'Server'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Auth Required</span>
            <span className={page.requiresAuth ? 'text-orange-400' : 'text-slate-500'}>
              {page.requiresAuth ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Last Modified</span>
            <span className="text-slate-300 text-xs">
              {new Date(page.lastModified).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* File Path */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">File Path</h4>
          <code className="block bg-slate-900 rounded-lg p-2 text-xs text-slate-300 font-mono break-all">
            {page.filePath}
          </code>
        </div>

        {/* Imports */}
        {page.imports.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Imports ({page.imports.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-auto">
              {page.imports.map((imp, i) => (
                <code
                  key={i}
                  className="block text-xs text-slate-400 font-mono truncate"
                >
                  {imp}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Educational Note */}
        <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700">
          <h4 className="text-xs font-semibold text-white mb-1">
            💡 {page.hasClientDirective ? 'Client Component' : 'Server Component'}
          </h4>
          <p className="text-xs text-slate-400">
            {page.hasClientDirective
              ? 'This component runs in the browser. It can use hooks, state, and browser APIs.'
              : 'This component runs on the server. It can fetch data directly and is more performant.'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <button
          onClick={onPreview}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>👁️</span>
          Preview Page
        </button>
        <button
          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          onClick={onEditWithAider}
        >
          <span>🤖</span>
          Edit with Aider
        </button>
      </div>
    </div>
  );
}
