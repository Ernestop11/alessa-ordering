'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AssociateRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // TODO: Implement associate registration
    // For now, show a message that this feature is coming soon
    setTimeout(() => {
      setMessage('Associate registration is coming soon. Please check back later or contact support.');
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
            Become an Associate
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our associate program and start earning commissions
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                placeholder="John Doe"
              />
            </div>
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code (Optional)
              </label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                placeholder="Enter referral code if you have one"
              />
              <p className="mt-1 text-xs text-gray-500">
                If you were referred by an existing associate, enter their referral code here
              </p>
            </div>

            {message && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-medium text-blue-800">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={true}
                className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/30 opacity-50 cursor-not-allowed"
              >
                Register (Coming Soon)
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/associate/login" className="font-semibold text-purple-600 hover:text-purple-700">
                Sign in
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

