'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AssociateLoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // TODO: Implement associate authentication
    // For now, show a message that this feature is coming soon
    setTimeout(() => {
      setError('Associate program login is coming soon. Please check back later.');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-2xl text-white shadow-lg">
              👥
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
              Alessa Cloud
            </span>
          </Link>
          <h2 className="text-4xl font-black text-gray-900">
            Associate Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your associate account to track referrals and earnings
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <div className="mb-6 rounded-lg bg-purple-50 border border-purple-200 p-4">
            <p className="text-sm font-medium text-purple-800">
              🚧 Associate Program Coming Soon
            </p>
            <p className="mt-2 text-xs text-purple-700">
              The MLM associate program is currently under development. Check back soon to start earning commissions!
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={true}
                className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/30 opacity-50 cursor-not-allowed"
              >
                Sign in (Coming Soon)
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              New to the associate program?{' '}
              <Link href="/associate/register" className="font-semibold text-purple-600 hover:text-purple-700">
                Join Now
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link href="/" className="font-semibold text-purple-600 hover:text-purple-700">
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

