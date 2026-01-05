'use client';

import { useState } from 'react';
import { VPSPageNode } from '@/lib/vps-dashboard/types';

interface PreviewPanelProps {
  page: VPSPageNode;
  onClose: () => void;
}

export default function PreviewPanel({ page, onClose }: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-slate-800 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-white">Preview: {page.route || '/'}</h3>
            <span className="text-xs text-slate-400 font-mono">{page.filePath}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Viewport toggles */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'desktop' ? '🖥️' : mode === 'tablet' ? '📱' : '📱'}
                  <span className="ml-1 capitalize">{mode}</span>
                </button>
              ))}
            </div>

            <a
              href={page.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Open in new tab ↗
            </a>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 bg-slate-900 p-4 overflow-auto flex justify-center">
          <div
            className="bg-white rounded-lg overflow-hidden transition-all duration-300 shadow-2xl"
            style={{
              width: viewportWidths[viewMode],
              height: '100%',
              maxWidth: '100%',
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-sm text-slate-400">Loading preview...</span>
                </div>
              </div>
            )}
            <iframe
              src={page.previewUrl}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title={`Preview of ${page.route}`}
            />
          </div>
        </div>

        {/* Footer with info */}
        <div className="p-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <span>Component: <code className="text-blue-400">{page.componentName}</code></span>
            <span>|</span>
            <span>Type: <span className={page.hasClientDirective ? 'text-yellow-400' : 'text-green-400'}>
              {page.hasClientDirective ? 'Client' : 'Server'}
            </span></span>
            <span>|</span>
            <span>Auth: <span className={page.requiresAuth ? 'text-orange-400' : 'text-slate-500'}>
              {page.requiresAuth ? 'Required' : 'Public'}
            </span></span>
          </div>
          <div className="text-slate-500">
            Viewport: {viewportWidths[viewMode]}
          </div>
        </div>
      </div>
    </div>
  );
}
