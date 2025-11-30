"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface JoinRewardsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenantSlug: string;
}

export default function JoinRewardsModal({ open, onClose, onSuccess, tenantSlug }: JoinRewardsModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Small delay before reload to show success state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
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

        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-4xl animate-pulse">
            🎁
          </div>
          <h2 className="text-3xl font-black text-gray-900">Join Rewards Program</h2>
          <p className="mt-2 text-sm text-gray-600">
            Start earning points on every order and unlock exclusive rewards!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              Email <span className="text-gray-400">(or phone)</span>
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
              Phone <span className="text-gray-400">(or email)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-amber-400 focus:outline-none"
              placeholder="(555) 123-4567"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-4 text-lg font-black text-black shadow-lg transition hover:scale-105 disabled:opacity-50"
          >
            {loading ? "Joining..." : "🎉 Join Now & Start Earning!"}
          </button>
        </form>
      </div>
    </div>
  );
}

