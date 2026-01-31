'use client';

import { useEffect, useState, useCallback } from 'react';

interface PiDevice {
  hostname: string;
  tenantSlug: string;
  uptime: number;
  cpuTemp: number;
  memFree: number;
  displays: number;
  wgLastHandshake: string;
  ip: string;
  lastSeen: string;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTimeSince(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

function StatusDot({ lastSeen }: { lastSeen: string }) {
  const seconds = (Date.now() - new Date(lastSeen).getTime()) / 1000;
  const color = seconds < 120 ? 'bg-green-500' : seconds < 300 ? 'bg-yellow-500' : 'bg-red-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

export default function SignageDashboard() {
  const [devices, setDevices] = useState<PiDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandStatus, setCommandStatus] = useState<Record<string, string>>({});

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/signage/health?key=alessa-internal');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDevices(data.devices || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15_000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const sendCommand = async (hostname: string, command: string) => {
    setCommandStatus((s) => ({ ...s, [hostname]: `Sending ${command}...` }));
    try {
      // Store command for next health ping pickup
      const res = await fetch('/api/signage/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname, command }),
      });
      if (res.ok) {
        setCommandStatus((s) => ({ ...s, [hostname]: `${command} queued` }));
      } else {
        setCommandStatus((s) => ({ ...s, [hostname]: 'Failed' }));
      }
    } catch {
      setCommandStatus((s) => ({ ...s, [hostname]: 'Error' }));
    }
    setTimeout(() => {
      setCommandStatus((s) => {
        const next = { ...s };
        delete next[hostname];
        return next;
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Signage Displays</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Raspberry Pi TV display controllers connected via WireGuard
            </p>
          </div>
          <button
            onClick={fetchDevices}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center py-12 text-neutral-400">Loading devices...</div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && devices.length === 0 && !error && (
          <div className="text-center py-16 text-neutral-500">
            <div className="text-5xl mb-4">📺</div>
            <p className="text-lg">No display devices connected</p>
            <p className="text-sm mt-2">
              Boot a Raspberry Pi with the signage agent to see it here
            </p>
          </div>
        )}

        {devices.length > 0 && (
          <div className="grid gap-4">
            {devices.map((device) => (
              <div
                key={device.hostname}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot lastSeen={device.lastSeen} />
                    <div>
                      <h3 className="font-semibold text-lg">{device.hostname}</h3>
                      <p className="text-neutral-400 text-sm">
                        {device.tenantSlug} &middot; {device.ip}
                      </p>
                    </div>
                  </div>
                  <span className="text-neutral-500 text-sm">
                    {formatTimeSince(device.lastSeen)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4">
                  <Stat label="Uptime" value={formatUptime(device.uptime)} />
                  <Stat
                    label="CPU Temp"
                    value={`${device.cpuTemp.toFixed(1)}°C`}
                    warn={device.cpuTemp > 70}
                  />
                  <Stat label="Free RAM" value={`${device.memFree} MB`} />
                  <Stat label="Displays" value={String(device.displays)} />
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-800">
                  <span className="text-neutral-500 text-xs mr-2">Commands:</span>
                  {['refresh', 'tv-on', 'tv-off', 'reboot'].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => sendCommand(device.hostname, cmd)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md text-xs transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                  {commandStatus[device.hostname] && (
                    <span className="text-xs text-amber-400 ml-2">
                      {commandStatus[device.hostname]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-neutral-800/50 rounded-lg p-3">
      <div className="text-neutral-500 text-xs mb-1">{label}</div>
      <div className={`font-mono text-sm ${warn ? 'text-red-400' : ''}`}>{value}</div>
    </div>
  );
}
