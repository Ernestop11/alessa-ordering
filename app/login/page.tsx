'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'owner' | 'associate' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-2xl text-white shadow-lg">
              ☁️
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Alessa Cloud
            </span>
          </Link>
          <h2 className="text-4xl font-black text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your login type to continue
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Restaurant Owner Login */}
          <button
            onClick={() => router.push('/owner/login')}
            className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-blue-50 p-8 text-left shadow-lg transition-all hover:scale-105 hover:border-blue-300 hover:shadow-xl"
          >
            <div className="mb-4 text-5xl transition-transform group-hover:scale-110">🍽️</div>
            <h3 className="text-2xl font-bold text-gray-900">Restaurant Owner</h3>
            <p className="mt-2 text-sm text-gray-600">
              Manage your restaurant&apos;s menu, orders, and settings
            </p>
            <div className="mt-6 flex items-center gap-2 text-blue-600 font-semibold">
              <span>Sign in</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </button>

          {/* Associate Login */}
          <button
            onClick={() => router.push('/associate/login')}
            className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-purple-50 p-8 text-left shadow-lg transition-all hover:scale-105 hover:border-purple-300 hover:shadow-xl"
          >
            <div className="mb-4 text-5xl transition-transform group-hover:scale-110">👥</div>
            <h3 className="text-2xl font-bold text-gray-900">Associate</h3>
            <p className="mt-2 text-sm text-gray-600">
              Track referrals, earnings, and manage your downline
            </p>
            <div className="mt-6 flex items-center gap-2 text-purple-600 font-semibold">
              <span>Sign in</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </button>
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

