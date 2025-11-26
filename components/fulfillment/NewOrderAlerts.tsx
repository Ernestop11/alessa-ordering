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
  // Modal alert settings
  modalAlertEnabled?: boolean; // Enable/disable full-screen modal
  modalFlashStyle?: 'strobe' | 'pulse' | 'rainbow' | 'solid'; // Flash style
  modalAutoDismiss?: boolean; // Auto-dismiss after timeout (optional)
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
    
    // EXTREMELY LOUD KITCHEN ALARM - Layered siren pattern
    // Layer multiple oscillators simultaneously for maximum volume
    const duration = 0.4; // Longer beeps for more impact
    
    // Pattern: HIGH-LOW-HIGH (siren effect) - play 2 cycles rapidly
    const frequencies = [1600, 900, 1600]; // Higher frequencies for piercing sound
    
    // Play pattern twice rapidly for immediate attention
    for (let cycle = 0; cycle < 2; cycle++) {
      frequencies.forEach((freq, i) => {
        // Layer 3 oscillators per frequency (layered for volume boost)
        for (let layer = 0; layer < 3; layer++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          // Square wave for harsh, piercing alarm sound
          osc.type = 'square';
          // Slight frequency variation per layer for richer, louder sound
          osc.frequency.setValueAtTime(freq + (layer * 40), now + cycle * 0.9 + i * 0.3);
          
          // MAXIMUM VOLUME - layered oscillators amplify the sound significantly
          gain.gain.setValueAtTime(0.0001, now + cycle * 0.9 + i * 0.3);
          gain.gain.exponentialRampToValueAtTime(volume * 1.0, now + cycle * 0.9 + i * 0.3 + 0.01);
          gain.gain.setValueAtTime(volume * 1.0, now + cycle * 0.9 + i * 0.3 + duration - 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + cycle * 0.9 + i * 0.3 + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + cycle * 0.9 + i * 0.3);
          osc.stop(now + cycle * 0.9 + i * 0.3 + duration);
        }
      });
    }
  },

  bell: (ctx: AudioContext, volume: number) => {
    const now = ctx.currentTime;
    
    // LOUD ALARM BELL - Multiple frequencies for attention
    // Creates a harsh, urgent buzzer sound
    const frequencies = [800, 1200, 1600]; // Lower, mid, high for urgency
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square'; // Square wave = harsh alarm sound
      osc.frequency.setValueAtTime(freq, now);
      
      const vol = volume * (0.7 - i * 0.15); // Slightly different volumes per frequency
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol * 0.8, now + 0.01);
      gain.gain.setValueAtTime(vol * 0.8, now + 0.3); // Hold loud
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  },

  ding: (ctx: AudioContext, volume: number) => {
    const now = ctx.currentTime;
    
    // LOUD ALERT - Double beep
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, now + i * 0.2); // Very high pitch
      
      gain.gain.setValueAtTime(0.0001, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(volume * 0.85, now + i * 0.2 + 0.01);
      gain.gain.setValueAtTime(volume * 0.85, now + i * 0.2 + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.2 + 0.16);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.18);
    }
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
  const [audioUnlocked, setAudioUnlocked] = useState(false); // Track unlock state for UI
  const [showModal, setShowModal] = useState(false);
  const [flashingColor, setFlashingColor] = useState(0); // For cycling colors in strobe mode
  const audioContextRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertedOrderIdRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const audioUnlockedRef = useRef(false); // Track if audio is unlocked
  const modalFlashIntervalRef = useRef<number | null>(null);
  const modalAutoDismissTimeoutRef = useRef<number | null>(null);
  const lastModalOrderIdRef = useRef<string | null>(null);

  // Initialize audio context and unlock it aggressively - ESPECIALLY for PWA
  useEffect(() => {
    const unlockAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('[Alarm] AudioContext created, state:', audioContextRef.current.state);
        }

        // Always try to resume - this unlocks audio for autoplay
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('[Alarm] AudioContext resumed, state:', audioContextRef.current.state);
        }
        
        // Play a silent sound to unlock audio context
        // This is a common technique to bypass autoplay restrictions
        if (!audioUnlockedRef.current && audioContextRef.current.state === 'running') {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.setValueAtTime(0.001, audioContextRef.current.currentTime); // Silent
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          oscillator.start();
          oscillator.stop(audioContextRef.current.currentTime + 0.01);
          audioUnlockedRef.current = true;
          setAudioUnlocked(true);
          console.log('[Alarm] Audio unlocked for autoplay!');
        } else if (audioContextRef.current.state === 'running') {
          audioUnlockedRef.current = true;
          setAudioUnlocked(true);
        }
      } catch (e) {
        console.error('[Alarm] Failed to unlock audio:', e);
        setAudioUnlocked(false);
      }
    };

    // Try to unlock immediately
    unlockAudio();

    // ALSO unlock immediately if we're in PWA mode (standalone display)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    if (isPWA) {
      console.log('[Alarm] PWA detected - aggressively unlocking audio');
      // Multiple unlock attempts for PWA
      setTimeout(unlockAudio, 100);
      setTimeout(unlockAudio, 500);
      setTimeout(unlockAudio, 1000);
    }

    // Also unlock on ANY user interaction
    const handleInteraction = () => {
      unlockAudio();
    };

    // Listen to multiple interaction types
    const events = ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown', 'touchend'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { once: false, passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  // Play alert sound
  const playAlertSound = useCallback(() => {
    if (!settings.enabled) {
      console.log('[Alarm] Sound disabled in settings');
      return;
    }

    // Check if muted
    if (settings.muteUntil && Date.now() < settings.muteUntil) {
      console.log('[Alarm] Muted until', new Date(settings.muteUntil));
      return;
    }

    if (settings.volume === 0) {
      console.log('[Alarm] Volume is 0');
      return;
    }

    console.log('[Alarm] Playing alert sound...', { soundType: settings.soundType, volume: settings.volume });

    setIsPlaying(true);

    // Ensure audio context is ready and unlocked
    const ensureAudioReady = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('[Alarm] AudioContext created during play, state:', audioContextRef.current.state);
        }

        // Always resume if suspended (required for autoplay)
        if (audioContextRef.current.state === 'suspended') {
          console.log('[Alarm] AudioContext suspended, attempting to resume...');
          await audioContextRef.current.resume();
          console.log('[Alarm] AudioContext resumed successfully, state:', audioContextRef.current.state);
          audioUnlockedRef.current = true;
        }

        // If still suspended, try to unlock by playing silent sound
        if (audioContextRef.current.state === 'suspended' && !audioUnlockedRef.current) {
          console.log('[Alarm] Attempting to unlock with silent sound...');
          const osc = audioContextRef.current.createOscillator();
          const gain = audioContextRef.current.createGain();
          gain.gain.setValueAtTime(0.001, audioContextRef.current.currentTime);
          osc.connect(gain);
          gain.connect(audioContextRef.current.destination);
          osc.start();
          osc.stop(audioContextRef.current.currentTime + 0.01);
          await audioContextRef.current.resume();
          audioUnlockedRef.current = true;
        }

        // Now play the actual sound
        if (audioContextRef.current.state === 'running') {
          playSoundNow();
        } else {
          console.error('[Alarm] AudioContext not running, state:', audioContextRef.current.state);
          setIsPlaying(false);
        }
      } catch (err) {
        console.error('[Alarm] Failed to ensure audio ready:', err);
        setIsPlaying(false);
      }
    };

    ensureAudioReady();

    function playSoundNow() {
      if (settings.soundType === 'custom' && settings.customSoundUrl) {
        // Play custom sound
        if (!customAudioRef.current) {
          customAudioRef.current = new Audio(settings.customSoundUrl);
        }
        customAudioRef.current.volume = settings.volume;
        customAudioRef.current.play().catch((err) => {
          console.error('[Alarm] Failed to play custom sound:', err);
        });

        setTimeout(() => setIsPlaying(false), 1000);
      } else {
        // Play built-in sound
        if (!audioContextRef.current) {
          console.error('[Alarm] AudioContext not available');
          setIsPlaying(false);
          return;
        }

        try {
          // Exclude 'custom' from type since it's handled above
          const soundType = settings.soundType === 'custom' ? 'chime' : settings.soundType;
          const pattern = SOUND_PATTERNS[soundType];
          if (pattern) {
            pattern(audioContextRef.current, settings.volume);
            console.log('[Alarm] Sound pattern played:', soundType);
          } else {
            console.error('[Alarm] Unknown sound type:', soundType);
          }
          setTimeout(() => setIsPlaying(false), 1200); // Longer timeout for layered sound
        } catch (err) {
          console.error('[Alarm] Failed to play sound pattern:', err);
          setIsPlaying(false);
        }
      }
    }
  }, [settings]);

  // Monitor for new orders - AUTO-TRIGGER IMMEDIATELY
  useEffect(() => {
    // Clear interval if no unacknowledged orders
    if (unacknowledgedOrders.length === 0) {
      lastAlertedOrderIdRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    // Get the newest unacknowledged order
    const newestOrder = unacknowledgedOrders[0];
    
    // ALWAYS start alarm if there are unacknowledged orders
    // Don't wait for new order ID - trigger immediately if interval not running!
    const isNewOrder = newestOrder.id !== lastAlertedOrderIdRef.current;
    const needsIntervalStart = !intervalRef.current || isNewOrder;

    if (needsIntervalStart) {
      // Mark this order as alerted
      if (isNewOrder) {
        lastAlertedOrderIdRef.current = newestOrder.id;
      }
      
      // Ensure audio is unlocked before playing
      const unlockAndPlay = async () => {
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
            audioUnlockedRef.current = true;
            console.log('[Alarm] Audio unlocked before first play');
          }
        } catch (e) {
          console.error('[Alarm] Failed to unlock before play:', e);
        }
        
        // Play immediately after unlocking
        console.log('[Alarm] Triggering alarm for unacknowledged orders:', unacknowledgedOrders.length);
        playAlertSound();
      };
      
      unlockAndPlay();
      
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start continuous alarm - repeat every 2.5 seconds
      intervalRef.current = window.setInterval(() => {
        // Check again if there are still unacknowledged orders
        if (unacknowledgedOrders.length > 0) {
          console.log('[Alarm] Continuous alarm trigger - unacknowledged:', unacknowledgedOrders.length);
          playAlertSound();
        } else {
          // Clean up if all acknowledged
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 2500); // Every 2.5 seconds - CONTINUOUS until acknowledged
    }

    return () => {
      // Don't clear interval here - only clear when orders are acknowledged
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
  
  // Modal alert settings with defaults
  const modalAlertEnabled = settings.modalAlertEnabled !== undefined ? settings.modalAlertEnabled : true;
  const modalFlashStyle = settings.modalFlashStyle || 'strobe';
  const modalAutoDismiss = settings.modalAutoDismiss !== undefined ? settings.modalAutoDismiss : false;

  // Handle full-screen modal with flashing effects
  useEffect(() => {
    if (!modalAlertEnabled || unacknowledgedOrders.length === 0) {
      setShowModal(false);
      if (modalFlashIntervalRef.current) {
        clearInterval(modalFlashIntervalRef.current);
        modalFlashIntervalRef.current = null;
      }
      if (modalAutoDismissTimeoutRef.current) {
        clearTimeout(modalAutoDismissTimeoutRef.current);
        modalAutoDismissTimeoutRef.current = null;
      }
      return;
    }

    // Show modal for new orders
    const newestOrder = unacknowledgedOrders[0];
    const isNewOrder = newestOrder.id !== lastModalOrderIdRef.current;
    
    if (isNewOrder) {
      lastModalOrderIdRef.current = newestOrder.id;
      setShowModal(true);
      setFlashingColor(0);
      
      // Start flashing effect based on style
      if (modalFlashStyle === 'strobe' || modalFlashStyle === 'rainbow') {
        modalFlashIntervalRef.current = window.setInterval(() => {
          setFlashingColor(prev => (prev + 1) % 4); // Cycle through 4 colors
        }, 200); // Flash every 200ms for strobe effect
      }
      
      // Auto-dismiss after 30 seconds if enabled
      if (modalAutoDismiss) {
        modalAutoDismissTimeoutRef.current = window.setTimeout(() => {
          setShowModal(false);
          if (modalFlashIntervalRef.current) {
            clearInterval(modalFlashIntervalRef.current);
            modalFlashIntervalRef.current = null;
          }
        }, 30000); // 30 seconds
      }
    }

    return () => {
      if (modalFlashIntervalRef.current) {
        clearInterval(modalFlashIntervalRef.current);
        modalFlashIntervalRef.current = null;
      }
      if (modalAutoDismissTimeoutRef.current) {
        clearTimeout(modalAutoDismissTimeoutRef.current);
        modalAutoDismissTimeoutRef.current = null;
      }
    };
  }, [unacknowledgedOrders, modalAlertEnabled, modalFlashStyle, modalAutoDismiss]);

  // Format currency helper
  const formatCurrency = (value: number | null | undefined) => {
    if (!value || Number.isNaN(value)) return '$0.00';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  };

  // Get flashing background color
  const getFlashColor = () => {
    if (modalFlashStyle === 'solid') return 'bg-red-600';
    if (modalFlashStyle === 'pulse') return 'bg-red-500';
    
    // Strobe and rainbow cycle through colors
    const colors = [
      'bg-red-600',
      'bg-orange-500',
      'bg-yellow-400',
      'bg-red-500',
    ];
    return colors[flashingColor % colors.length];
  };

  // Render unlock button if audio is not unlocked
  const renderUnlockButton = () => {
    if (audioUnlocked) return null;
    
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <p className="text-sm font-medium mb-2">⚠️ Audio Locked</p>
        <p className="text-xs mb-3">Tap to unlock alarm sounds</p>
        <button
          onClick={async () => {
            try {
              if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
              }
              if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
              }
              // Play a test sound
              const osc = audioContextRef.current.createOscillator();
              const gain = audioContextRef.current.createGain();
              gain.gain.setValueAtTime(0.001, audioContextRef.current.currentTime);
              osc.connect(gain);
              gain.connect(audioContextRef.current.destination);
              osc.start();
              osc.stop(audioContextRef.current.currentTime + 0.01);
              audioUnlockedRef.current = true;
              setAudioUnlocked(true);
              console.log('[Alarm] Audio manually unlocked!');
              
              // Play a quick test sound to confirm
              setTimeout(() => playAlertSound(), 100);
            } catch (e) {
              console.error('[Alarm] Failed to unlock:', e);
              alert('Failed to unlock audio. Please check browser settings.');
            }
          }}
          className="w-full bg-white text-yellow-600 px-3 py-2 rounded font-medium text-sm hover:bg-gray-100 transition-colors"
        >
          Unlock Audio
        </button>
      </div>
    );
  };

  // Render full-screen flashing modal
  const renderModal = () => {
    if (!showModal || !modalAlertEnabled || unacknowledgedOrders.length === 0) return null;

    return (
      <>
        {/* CSS animations for flashing effects */}
        <style jsx global>{`
          @keyframes strobe {
            0%, 100% { opacity: 1; background-color: #dc2626; }
            25% { opacity: 1; background-color: #f97316; }
            50% { opacity: 1; background-color: #facc15; }
            75% { opacity: 1; background-color: #ef4444; }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.02); }
          }
          
          @keyframes rainbow {
            0% { background-color: #dc2626; }
            25% { background-color: #f97316; }
            50% { background-color: #facc15; }
            75% { background-color: #3b82f6; }
            100% { background-color: #dc2626; }
          }
          
          .strobe-bg {
            animation: strobe 0.4s infinite;
          }
          
          .pulse-bg {
            animation: pulse 1s infinite;
          }
          
          .rainbow-bg {
            animation: rainbow 1s infinite;
          }
        `}</style>

        {/* Full-screen modal overlay */}
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center ${
            modalFlashStyle === 'strobe' ? 'strobe-bg' :
            modalFlashStyle === 'pulse' ? 'pulse-bg bg-red-500' :
            modalFlashStyle === 'rainbow' ? 'rainbow-bg' :
            getFlashColor()
          }`}
          style={{
            transition: modalFlashStyle === 'strobe' || modalFlashStyle === 'rainbow' 
              ? 'none' 
              : 'background-color 0.2s ease'
          }}
        >
          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full mx-4 transform scale-105 animate-bounce">
            <div className="text-center space-y-6">
              {/* Large order count */}
              <div className="text-9xl font-black text-red-600 animate-pulse">
                {unacknowledgedOrders.length}
              </div>
              
              {/* Title */}
              <h2 className="text-5xl font-black text-gray-900 uppercase tracking-wider">
                New Order{unacknowledgedOrders.length > 1 ? 'S' : ''}!
              </h2>
              
              {/* Order details */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {unacknowledgedOrders.slice(0, 5).map((order, index) => (
                  <div 
                    key={order.id} 
                    className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <p className="text-2xl font-bold text-gray-900">
                      {order.customerName || 'Guest'}
                    </p>
                    <p className="text-xl text-gray-600 mt-1">
                      {formatCurrency(order.totalAmount)} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                    {order.fulfillmentMethod === 'delivery' && (
                      <p className="text-sm text-blue-600 mt-1 font-semibold">
                        🚗 Delivery Order
                      </p>
                    )}
                  </div>
                ))}
                {unacknowledgedOrders.length > 5 && (
                  <p className="text-2xl text-gray-700 font-semibold">
                    +{unacknowledgedOrders.length - 5} more order{unacknowledgedOrders.length - 5 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              {/* Acknowledge button */}
              <button
                onClick={() => {
                  unacknowledgedOrders.forEach(order => onAcknowledge(order.id));
                  setShowModal(false);
                  if (modalFlashIntervalRef.current) {
                    clearInterval(modalFlashIntervalRef.current);
                    modalFlashIntervalRef.current = null;
                  }
                  if (modalAutoDismissTimeoutRef.current) {
                    clearTimeout(modalAutoDismissTimeoutRef.current);
                    modalAutoDismissTimeoutRef.current = null;
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-4xl font-black py-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all active:scale-95"
                style={{ minHeight: '80px' }}
              >
                ✓ ACKNOWLEDGE ALL
              </button>
              
              {modalAutoDismiss && (
                <p className="text-sm text-white/80 font-medium">
                  Auto-dismissing in 30 seconds...
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {renderModal()}
      {renderUnlockButton()}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        <option value="chime">Kitchen Alarm (Triple Beep) - Default</option>
                        <option value="bell">Loud Alarm Bell</option>
                        <option value="ding">Alert Beep (Double)</option>
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

                  {/* Modal Alert Settings */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide">Full-Screen Modal Alert</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Enable Modal */}
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalAlertEnabled}
                          onChange={(e) => onSettingsChange({
                            ...settings,
                            modalAlertEnabled: e.target.checked,
                          })}
                          className="rounded"
                        />
                        <span>Enable Full-Screen Modal</span>
                      </label>

                      {/* Flash Style */}
                      <div>
                        <label className="block text-xs font-medium mb-2">Flash Style</label>
                        <select
                          value={modalFlashStyle}
                          onChange={(e) => onSettingsChange({
                            ...settings,
                            modalFlashStyle: e.target.value as 'strobe' | 'pulse' | 'rainbow' | 'solid',
                          })}
                          className="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-sm"
                          disabled={!modalAlertEnabled}
                        >
                          <option value="strobe">Strobe (Rapid Flash)</option>
                          <option value="pulse">Pulse (Fade In/Out)</option>
                          <option value="rainbow">Rainbow (Color Cycle)</option>
                          <option value="solid">Solid (Bright Red)</option>
                        </select>
                      </div>

                      {/* Auto-Dismiss */}
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalAutoDismiss}
                          onChange={(e) => onSettingsChange({
                            ...settings,
                            modalAutoDismiss: e.target.checked,
                          })}
                          className="rounded"
                          disabled={!modalAlertEnabled}
                        />
                        <span>Auto-Dismiss (30s)</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-3 text-xs opacity-75">
                    <p>
                      <strong>Accessibility Note:</strong> Sounds will repeat every 2.5 seconds until acknowledged.
                      Full-screen modal provides visual alert that cannot be missed. You can mute alerts for 1 hour or adjust volume to 0 to disable sound completely.
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
