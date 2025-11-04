"use client";

import { useEffect, useMemo, useState } from 'react';

interface LogEntry {
  id: string;
  source: string;
  level: string;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
}

const LEVEL_STYLES: Record<string, string> = {
  error: 'text-red-700 bg-red-50 border-red-200',
  warn: 'text-amber-700 bg-amber-50 border-amber-200',
  info: 'text-blue-700 bg-blue-50 border-blue-200',
};

export default function IntegrationLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integration-logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load integration logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30_000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
      const matchesText =
        !filter ||
        [log.message, JSON.stringify(log.payload ?? {}), log.level, log.source]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(filter.toLowerCase()));
      return matchesSource && matchesText;
    });
  }, [logs, filter, sourceFilter]);

  const distinctSources = useMemo(() => {
    const sources = new Set(logs.map((log) => log.source));
    return Array.from(sources);
  }, [logs]);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Integration Logs</h2>
          <p className="text-sm text-gray-500">
            Track Apple Pay, DoorDash, POS, and tax provider activity. Only the most recent 100 entries are shown.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-3">
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 md:w-40"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            {distinctSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search logs"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 md:w-64"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200">
        {loading ? (
          <div className="p-6 text-gray-500">Loading logs…</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-gray-500">No logs yet. Trigger Apple Pay validation or DoorDash quotes to see entries.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const style = LEVEL_STYLES[log.level] || 'text-gray-700 bg-gray-50 border-gray-200';
              return (
                <li key={log.id} className={`px-6 py-4 border-l-4 ${style}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gray-500">
                      <span>{log.source}</span>
                      <span>·</span>
                      <span>{log.level}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.message && <p className="mt-2 text-sm text-gray-900">{log.message}</p>}
                  {log.payload && (
                    <pre className="mt-2 overflow-x-auto rounded bg-white/70 p-3 text-xs text-gray-600">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
