'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function LandingPage() {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as { role?: string } | undefined)?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-2xl text-white">
                ☁️
              </div>
              <span className="text-xl font-bold text-gray-900">Alessa Cloud</span>
            </div>
            <nav className="flex items-center gap-4">
              {isSuperAdmin ? (
                <Link
                  href="/super-admin"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Admin Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Multi-Tenant Restaurant
              <br />
              <span className="text-blue-600">Ordering Platform</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Everything you need to run your restaurant&apos;s online ordering system.
              <br />
              Stripe payments, menu management, fulfillment tracking, and more.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isSuperAdmin ? (
                <Link
                  href="/super-admin"
                  className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/admin/login"
                    className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Admin Login
                  </Link>
                  <Link
                    href="/super-admin"
                    className="text-base font-semibold leading-6 text-gray-900"
                  >
                    Super Admin <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                A complete platform for managing your restaurant&apos;s online presence
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                <div className="text-3xl">💳</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Stripe Payments</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Integrated Stripe Connect for secure payments with platform fees. Full webhook support for order processing.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                <div className="text-3xl">📱</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Menu Management</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Easy menu editor with image uploads, galleries, sections, and featured items. Real-time updates.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                <div className="text-3xl">🚀</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Fulfillment</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Real-time order tracking, kitchen dashboard, and auto-print integration for seamless operations.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                <div className="text-3xl">🎨</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Branding</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Custom logos, colors, hero images, and gallery rotation. Full control over your restaurant&apos;s look.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                <div className="text-3xl">👥</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Multi-Tenant</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Manage multiple restaurants from one platform. Each tenant has isolated data and settings.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                <div className="text-3xl">📊</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Analytics</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Track orders, revenue, and customer data. Platform-wide metrics for super admins.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 rounded-3xl bg-blue-600 px-6 py-16 sm:px-12 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg leading-8 text-blue-100">
                Contact us to set up your restaurant on the platform, or log in to manage your existing account.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {isSuperAdmin ? (
                  <Link
                    href="/super-admin"
                    className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/admin/login"
                    className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
                  >
                    Admin Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Alessa Cloud. All rights reserved.</p>
            <p className="mt-2">
              Multi-tenant restaurant ordering platform powered by Next.js, Stripe, and PostgreSQL.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

