'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80',
];

export default function LandingPage() {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as { role?: string } | undefined)?.role === 'super_admin';
  const [heroIndex, setHeroIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handleChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || HERO_IMAGES.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-2xl text-white shadow-lg">
                ☁️
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Alessa Cloud
              </span>
            </div>
            <nav className="flex items-center gap-4">
              {isSuperAdmin ? (
                <Link
                  href="/super-admin"
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-105 hover:shadow-blue-500/50"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-105 hover:shadow-blue-500/50"
                >
                  Admin Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Rotating Images */}
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden text-white md:min-h-[700px]">
        {/* Background Images with Smooth Transitions */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((image, index) => (
            <div
              key={`hero-bg-${index}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 z-20 bg-gradient-to-br from-blue-900/80 via-purple-900/70 to-indigo-900/80" />
          {/* Animated Gradient Overlay for Depth */}
          <div className="absolute inset-0 z-30 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
        <div className="relative z-40 mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
            Multi-Tenant Restaurant
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Ordering Platform
            </span>
          </h1>
          <p className="mt-6 text-xl leading-8 text-white/90 md:text-2xl">
            Everything you need to run your restaurant&apos;s online ordering system.
            <br />
            <span className="text-white/70">Stripe payments, menu management, fulfillment tracking, and more.</span>
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isSuperAdmin ? (
              <Link
                href="/super-admin"
                className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-purple-500/30 transition hover:scale-105 hover:shadow-purple-500/50"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/admin/login"
                  className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-purple-500/30 transition hover:scale-105 hover:shadow-purple-500/50"
                >
                  Admin Login →
                </Link>
                <Link
                  href="/super-admin"
                  className="rounded-full border-2 border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/20"
                >
                  Super Admin Access
                </Link>
              </>
            )}
          </div>
          {/* Image Indicators */}
          {!prefersReducedMotion && HERO_IMAGES.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {HERO_IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setHeroIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === heroIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16 sm:py-24">

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

