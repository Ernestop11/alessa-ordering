"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FulfillmentOrder } from './types';

export interface AlertSettings {
  enabled: boolean;
  volume: number; // 0-1
  soundType: 'chime' | 'bell' | 'ding' | 'custom';
  customSoundUrl?: string;
  flashingEnabled: boolean;
  muteUntil?: number; // timestamp
}

interface Props {
  unacknowledgedOrders: FulfillmentOrder[];
  onAcknowledge: (orderId: string) => void;
  settings: AlertSettings;
  onSettingsChange: (settings: AlertSettings) => void;
}

// Built-in sound patterns (using Web Audio API)
const SOUND_PATTERNS = {
  chime: (ctx: AudioContext, volume: number) => {
    const now = ctx.currentTime;

    // Create a pleasant chime sound (two notes)
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 * (i === 0 ? 1 : 1.5), now + i * 0.15);

      gain.gain.setValueAtTime(0.0001, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(volume * 0.3, now + i * 0.15 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    }
  },

  bell: (ctx: AudioContext, volume: number) => {
    const now = ctx.currentTime;

    // Bell sound (multiple harmonics)
    [440, 880, 1320, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const vol = volume * (1 - i * 0.15);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol * 0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  },

  ding: (ctx: AudioContext, volume: number) => {
    const now = ctx.currentTime;

    // Simple ding sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  },
};

export default function NewOrderAlerts({
  unacknowledgedOrders,
  onAcknowledge,
  settings,
  onSettingsChange,
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertedOrderIdRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error('Failed to create AudioContext:', e);
        }
      }

      if (audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume();
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Play alert sound
  const playAlertSound = useCallback(() => {
    if (!settings.enabled) return;

    // Check if muted
    if (settings.muteUntil && Date.now() < settings.muteUntil) {
      return;
    }

    if (settings.volume === 0) return;

    setIsPlaying(true);

    if (settings.soundType === 'custom' && settings.customSoundUrl) {
      // Play custom sound
      if (!customAudioRef.current) {
        customAudioRef.current = new Audio(settings.customSoundUrl);
      }
      customAudioRef.current.volume = settings.volume;
      customAudioRef.current.play().catch(console.error);

      setTimeout(() => setIsPlaying(false), 1000);
    } else {
      // Play built-in sound
      if (!audioContextRef.current) return;

      if (settings.soundType !== 'custom') {
        const pattern = SOUND_PATTERNS[settings.soundType];
        pattern(audioContextRef.current, settings.volume);
      }

      setTimeout(() => setIsPlaying(false), 500);
    }
  }, [settings]);

  // Monitor for new orders
  useEffect(() => {
    if (unacknowledgedOrders.length === 0) {
      lastAlertedOrderIdRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Get the newest unacknowledged order
    const newestOrder = unacknowledgedOrders[0];

    // If this is a new order we haven't alerted for, play sound
    if (newestOrder.id !== lastAlertedOrderIdRef.current) {
      lastAlertedOrderIdRef.current = newestOrder.id;
      playAlertSound();

      // Start repeating alert every 10 seconds if still unacknowledged
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        if (unacknowledgedOrders.length > 0) {
          playAlertSound();
        }
      }, 10000); // Repeat every 10 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [unacknowledgedOrders, playAlertSound]);

  const handleTestSound = () => {
    playAlertSound();
  };

  const handleVolumeChange = (volume: number) => {
    onSettingsChange({ ...settings, volume });
  };

  const handleSoundTypeChange = (soundType: AlertSettings['soundType']) => {
    onSettingsChange({ ...settings, soundType });
  };

  const handleToggleFlashing = () => {
    onSettingsChange({ ...settings, flashingEnabled: !settings.flashingEnabled });
  };

  const handleToggleMute = () => {
    if (settings.muteUntil && Date.now() < settings.muteUntil) {
      // Unmute
      onSettingsChange({ ...settings, muteUntil: undefined });
    } else {
      // Mute for 1 hour
      onSettingsChange({ ...settings, muteUntil: Date.now() + 60 * 60 * 1000 });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file (MP3, WAV, etc.)');
      return;
    }

    // Create object URL for the file
    const url = URL.createObjectURL(file);
    onSettingsChange({
      ...settings,
      soundType: 'custom',
      customSoundUrl: url,
    });
  };

  const isMuted = settings.muteUntil && Date.now() < settings.muteUntil;

  return (
    <>
      {/* Persistent Notification Banner */}
      {unacknowledgedOrders.length > 0 && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 ${
            settings.flashingEnabled && !isMuted ? 'animate-pulse' : ''
          }`}
        >
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center flex-1">
                  <span className="flex p-2 rounded-lg bg-red-600">
                    <svg
                      className="h-6 w-6 text-white animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </span>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">
                      {unacknowledgedOrders.length} New Order{unacknowledgedOrders.length > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      {unacknowledgedOrders.map(o => o.customerName || 'Guest').slice(0, 3).join(', ')}
                      {unacknowledgedOrders.length > 3 && ` +${unacknowledgedOrders.length - 3} more`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                    title="Alert Settings"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      unacknowledgedOrders.forEach(order => onAcknowledge(order.id));
                    }}
                    className="px-4 py-1.5 bg-white text-red-600 hover:bg-gray-100 rounded font-medium text-sm transition-colors"
                  >
                    Acknowledge All
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Volume Control */}
                    <div>
                      <label className="block text-xs font-medium mb-2">
                        Volume: {Math.round(settings.volume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.volume * 100}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                        className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Sound Type */}
                    <div>
                      <label className="block text-xs font-medium mb-2">Sound Type</label>
                      <select
                        value={settings.soundType}
                        onChange={(e) => handleSoundTypeChange(e.target.value as AlertSettings['soundType'])}
                        className="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-sm"
                      >
                        <option value="chime">Chime (Default)</option>
                        <option value="bell">Bell</option>
                        <option value="ding">Ding</option>
                        <option value="custom">Custom Sound</option>
                      </select>
                    </div>

                    {/* Custom Sound Upload */}
                    {settings.soundType === 'custom' && (
                      <div>
                        <label className="block text-xs font-medium mb-2">Upload Sound</label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="w-full text-xs bg-white/20 border border-white/30 rounded px-2 py-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/30 file:text-white file:text-xs"
                        />
                      </div>
                    )}

                    {/* Accessibility Controls */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleTestSound}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        Test Sound
                      </button>

                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.flashingEnabled}
                          onChange={handleToggleFlashing}
                          className="rounded"
                        />
                        <span>Flashing Banner</span>
                      </label>

                      <button
                        onClick={handleToggleMute}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isMuted
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        {isMuted ? 'Unmute' : 'Mute (1hr)'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs opacity-75">
                    <p>
                      <strong>Accessibility Note:</strong> Sounds will repeat every 10 seconds until acknowledged.
                      You can mute alerts for 1 hour or adjust volume to 0 to disable sound completely.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visual indicator when playing */}
      {isPlaying && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <span className="text-sm font-medium">🔔 Alert Playing</span>
        </div>
      )}
    </>
  );
}
