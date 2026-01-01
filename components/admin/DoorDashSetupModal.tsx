'use client';

import { useState } from 'react';
import { X, ExternalLink, Key, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface DoorDashSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DoorDashSetupModal({
  isOpen,
  onClose,
  onSuccess,
}: DoorDashSetupModalProps) {
  const [step, setStep] = useState<'intro' | 'credentials' | 'success'>('intro');
  const [developerId, setDeveloperId] = useState('');
  const [keyId, setKeyId] = useState('');
  const [signingSecret, setSigningSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!developerId.trim() || !keyId.trim() || !signingSecret.trim()) {
      setError('All three credentials are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/delivery/doordash/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerId: developerId.trim(),
          keyId: keyId.trim(),
          signingSecret: signingSecret.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect DoorDash');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('intro');
    setDeveloperId('');
    setKeyId('');
    setSigningSecret('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚴</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect DoorDash Drive</h2>
              <p className="text-sm text-gray-600">Enter your API credentials</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Connect Your Existing DoorDash Account
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  If you already have a DoorDash business account (from Wix or another platform),
                  you can use the same developer credentials here.
                </p>
                <a
                  href="https://developer.doordash.com/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Open DoorDash Developer Portal
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Where to find your credentials:</h4>
                <ol className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">1</span>
                    <span>Go to <strong>developer.doordash.com</strong> and sign in with your DoorDash business email</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">2</span>
                    <span>Click on <strong>Credentials</strong> in the left sidebar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">3</span>
                    <span>Create a new access key or use an existing one</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">4</span>
                    <span>Copy your <strong>Developer ID</strong>, <strong>Key ID</strong>, and <strong>Signing Secret</strong></span>
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Important:</strong> The Signing Secret is only shown once when you create the key.
                    If you don't have it, you'll need to create a new access key.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('credentials')}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                I have my credentials →
              </button>
            </div>
          )}

          {step === 'credentials' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    Developer ID
                  </label>
                  <input
                    type="text"
                    value={developerId}
                    onChange={(e) => setDeveloperId(e.target.value)}
                    placeholder="e.g., 12345678-abcd-1234-efgh-1234567890ab"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    Key ID
                  </label>
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    placeholder="e.g., abcd1234-5678-90ab-cdef-1234567890ab"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Signing Secret
                  </label>
                  <input
                    type="password"
                    value={signingSecret}
                    onChange={(e) => setSigningSecret(e.target.value)}
                    placeholder="Your signing secret (paste from portal)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is stored securely and used to authenticate API requests
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !developerId || !keyId || !signingSecret}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect DoorDash'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                DoorDash Connected!
              </h3>
              <p className="text-gray-600 mb-4">
                Your DoorDash Drive account is now linked. You can start accepting delivery orders.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
