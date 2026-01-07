'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export default function QRScanner({ onScan, onError, isActive = true }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const handleScan = useCallback(
    (decodedText: string) => {
      // Debounce - don't scan same code within 3 seconds
      const now = Date.now();
      if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 3000) {
        return;
      }

      lastScanRef.current = decodedText;
      lastScanTimeRef.current = now;

      // Vibrate for feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      onScan(decodedText);
    },
    [onScan]
  );

  useEffect(() => {
    if (!isActive) {
      // Stop scanner when not active
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
        setIsScanning(false);
      }
      return;
    }

    const startScanner = async () => {
      try {
        // Check for camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach((track) => track.stop());
        setHasPermission(true);

        // Initialize scanner
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          handleScan,
          () => {} // Ignore errors during scanning
        );

        setIsScanning(true);
        setError(null);
      } catch (err) {
        console.error('Scanner error:', err);
        setHasPermission(false);
        setError('Camera access denied. Please allow camera access to scan QR codes.');
        onError?.('Camera access denied');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
        setIsScanning(false);
      }
    };
  }, [isActive, handleScan, onError]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-2xl">
        <div className="text-red-400 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg font-medium">Camera Access Required</p>
          <p className="text-sm text-gray-400 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 rounded-lg text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        id="qr-reader"
        className="overflow-hidden rounded-2xl bg-black"
        style={{ width: '100%', maxWidth: '400px', aspectRatio: '1' }}
      />

      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-emerald-400 rounded-lg">
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

          {/* Scanning line animation */}
          <div className="absolute inset-x-2 h-0.5 bg-emerald-400 animate-scan" />
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/70 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm text-white">{isScanning ? 'Scanning...' : 'Starting camera...'}</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
          100% {
            top: 0;
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
