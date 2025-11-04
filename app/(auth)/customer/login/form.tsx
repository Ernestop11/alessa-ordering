"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface LoginFormProps {
  returnTo?: string;
  tenantSlug: string;
}

export default function CustomerLoginForm({ returnTo, tenantSlug }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<'request' | 'verify'>('request');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tenantParam = `?tenant=${tenantSlug}`;

  const requestLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(`/api/customers/login/request${tenantParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined, phone: phone || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus('Magic link sent (check logs in dev). Paste code below.');
      setToken(data.token);
      setStage('verify');
    } catch (err) {
      console.error(err);
      setError('Failed to send login link.');
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(`/api/customers/login/verify${tenantParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('Logged in! Redirecting…');
      router.push(returnTo || `/customer/orders${tenantParam}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Customer Login</h1>
        <p className="text-sm text-gray-600">
          Enter your email or phone number and we&apos;ll send you a one-time code to view your orders.
        </p>
      </div>
      {status && <p className="rounded bg-green-50 p-3 text-sm text-green-700">{status}</p>}
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {stage === 'request' ? (
        <form onSubmit={requestLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="(555) 123-4567"
            />
          </div>
          <p className="text-xs text-gray-500">Provide either email or phone.</p>
          <button
            type="submit"
            disabled={loading || (!email && !phone)}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send Login Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">One-time Code</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Paste the code you received"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Log In'}
          </button>
        </form>
      )}
    </div>
  );
}
