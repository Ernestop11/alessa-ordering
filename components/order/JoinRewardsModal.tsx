"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface JoinRewardsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenantSlug: string;
  initialMode?: 'join' | 'login';
}

export default function JoinRewardsModal({ open, onClose, onSuccess, tenantSlug, initialMode = 'join' }: JoinRewardsModalProps) {
  const [mode, setMode] = useState<'join' | 'login'>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset mode when modal opens with different initialMode
  if (open && mode !== initialMode && !loading) {
    setMode(initialMode);
  }

  if (!open) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setError(null);
  };

  const switchMode = (newMode: 'join' | 'login') => {
    resetForm();
    setMode(newMode);
  };

  // Handle Join/Enroll (new member)
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setError("Please provide an email or phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rewards/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to join rewards program");
      }

      // Success - refresh page to show member UI
      if (onSuccess) onSuccess();
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  // Handle Login (existing member - direct login with email/phone)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setError("Please provide your email or phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rewards/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, phone: phone || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Success - refresh page to show member UI
      if (onSuccess) onSuccess();
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-white/50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-3xl">
            {mode === 'login' ? '👋' : '🎁'}
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {mode === 'join' ? 'Join Rewards' : 'Welcome Back!'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'join'
              ? 'Start earning points on every order!'
              : 'Sign in to view your points and rewards'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-white/50 p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode('join')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition ${
              mode === 'join'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            New Member
          </button>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition ${
              mode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* JOIN FORM */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-amber-400 focus:outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-amber-400 focus:outline-none"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-amber-400 focus:outline-none"
                placeholder="(555) 123-4567"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!email && !phone)}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-4 text-lg font-black text-black shadow-lg transition hover:scale-105 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Now & Start Earning!"}
            </button>
          </form>
        )}

        {/* LOGIN FORM - Direct login with email/phone */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-amber-400 focus:outline-none"
                placeholder="john@example.com"
              />
            </div>

            <div className="text-center text-sm text-gray-500">or</div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-amber-400 focus:outline-none"
                placeholder="(555) 123-4567"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!email && !phone)}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-4 text-lg font-black text-black shadow-lg transition hover:scale-105 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Don't have an account? Switch to "New Member" above
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
