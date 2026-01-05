'use client';

import { useState, useCallback } from 'react';
import {
  VPSPageNode,
  SystemOverview,
  CanvasState,
  PageGroup,
  GROUP_LABELS,
} from '@/lib/vps-dashboard/types';
import OverviewMap from './OverviewMap';
import PagesCanvas from './PagesCanvas';
import InfoPanel from './panels/InfoPanel';
import PreviewPanel from './panels/PreviewPanel';
import AiderPanel from './panels/AiderPanel';
import NginxOffice from './offices/NginxOffice';
import PM2Office from './offices/PM2Office';
import PostgresOffice from './offices/PostgresOffice';
import RedisOffice from './offices/RedisOffice';

interface VPSDashboardProps {
  initialPages: VPSPageNode[];
  initialApiRoutes: { route: string; methods: string[]; filePath: string }[];
  initialSystem: SystemOverview;
  pageStats: {
    total: number;
    byGroup: Record<PageGroup, number>;
    clientComponents: number;
    serverComponents: number;
    protectedPages: number;
  };
}

type ViewMode = 'overview' | 'pages' | 'apis' | 'nginx' | 'pm2' | 'postgres' | 'redis';

export default function VPSDashboard({
  initialPages,
  initialApiRoutes,
  initialSystem,
  pageStats,
}: VPSDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedPage, setSelectedPage] = useState<VPSPageNode | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAider, setShowAider] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [system, setSystem] = useState(initialSystem);
  const [pages] = useState(initialPages);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/vps-dashboard/system');
      if (res.ok) {
        const data = await res.json();
        setSystem(data);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setIsRefreshing(false);
  }, []);

  const handlePageSelect = useCallback((page: VPSPageNode) => {
    setSelectedPage(page);
    setShowPreview(true);
  }, []);

  const handleNavigate = useCallback((target: ViewMode) => {
    setViewMode(target);
  }, []);

  const handleCloseOffice = useCallback(() => {
    setViewMode('overview');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🔭</span>
              VPS Observatory
            </h1>
            <span className="flex items-center gap-1.5 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              Refresh
            </button>
            <button className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
              ❓ Help
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '🗺️' },
            { id: 'nginx', label: 'Nginx', icon: '🌐', color: 'text-green-400' },
            { id: 'pm2', label: 'PM2', icon: '⚡', color: 'text-blue-400' },
            { id: 'postgres', label: 'PostgreSQL', icon: '🗄️', color: 'text-purple-400' },
            { id: 'redis', label: 'Redis', icon: '⚡', color: 'text-red-400' },
            { id: 'pages', label: `Pages (${pageStats.total})`, icon: '📄' },
            { id: 'apis', label: `APIs (${initialApiRoutes.length})`, icon: '🔌' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                viewMode === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              } ${tab.color || ''}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          {viewMode === 'overview' && (
            <OverviewMap
              system={system}
              pageStats={pageStats}
              onNavigate={handleNavigate}
            />
          )}

          {viewMode === 'pages' && (
            <PagesCanvas
              pages={pages}
              onPageSelect={handlePageSelect}
              selectedPageId={selectedPage?.id}
            />
          )}

          {viewMode === 'nginx' && (
            <NginxOffice
              nginx={system.nginx}
              onClose={handleCloseOffice}
              onNavigate={handleNavigate}
            />
          )}

          {viewMode === 'pm2' && (
            <PM2Office
              pm2={system.pm2}
              onClose={handleCloseOffice}
              onNavigate={handleNavigate}
            />
          )}

          {viewMode === 'postgres' && (
            <PostgresOffice
              postgres={system.postgres}
              onClose={handleCloseOffice}
              onNavigate={handleNavigate}
            />
          )}

          {viewMode === 'redis' && (
            <RedisOffice
              redis={system.redis}
              onClose={handleCloseOffice}
              onNavigate={handleNavigate}
            />
          )}

          {viewMode === 'apis' && (
            <div className="h-full overflow-auto p-6">
              <h2 className="text-xl font-bold mb-4">API Routes ({initialApiRoutes.length})</h2>
              <div className="grid gap-2">
                {initialApiRoutes.map((api) => (
                  <div
                    key={api.route}
                    className="flex items-center gap-4 bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex gap-1">
                      {api.methods.map((method) => (
                        <span
                          key={method}
                          className={`text-xs font-mono px-2 py-0.5 rounded ${
                            method === 'GET'
                              ? 'bg-green-500/20 text-green-400'
                              : method === 'POST'
                              ? 'bg-blue-500/20 text-blue-400'
                              : method === 'PUT'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : method === 'DELETE'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-sm text-slate-300">{api.route}</span>
                    <span className="text-xs text-slate-500 ml-auto">{api.filePath}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Info Panel */}
        {selectedPage && (
          <InfoPanel
            page={selectedPage}
            onClose={() => setSelectedPage(null)}
            onPreview={() => setShowPreview(true)}
            onEditWithAider={() => setShowAider(true)}
          />
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedPage && (
        <PreviewPanel
          page={selectedPage}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Aider Modal */}
      {showAider && selectedPage && (
        <AiderPanel
          page={selectedPage}
          onClose={() => setShowAider(false)}
        />
      )}

      {/* Bottom Status Bar */}
      <footer className="flex-shrink-0 border-t border-slate-700 bg-slate-800/50 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-6">
            <span>Memory: {system.system.memoryUsed} / {system.system.memoryTotal}</span>
            <span>Disk: {system.system.diskUsed} / {system.system.diskTotal}</span>
            <span>CPU Load: {system.system.cpuLoad}</span>
            <span>Uptime: {system.system.uptime}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last scan: {new Date(system.scannedAt).toLocaleTimeString()}</span>
            <span className="flex items-center gap-2">
              {system.nginx.status === 'running' && <span className="w-2 h-2 bg-green-500 rounded-full" />}
              {system.pm2.apps.filter(a => a.status === 'online').length} apps online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
