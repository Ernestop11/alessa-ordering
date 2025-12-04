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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-2xl text-white shadow-lg shadow-blue-500/30 transition hover:scale-105">
                ☁️
              </div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden text-white">
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
        <div className="relative z-40 mx-auto max-w-5xl px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
            Platform Live & Ready
          </div>
          <h1 className="text-6xl font-black tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl">
            Multi-Tenant
            <br />
            <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Restaurant Platform
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-2xl leading-relaxed text-white/90 md:text-3xl">
            Everything you need to run your restaurant&apos;s online ordering system.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Stripe payments, menu management, fulfillment tracking, and more.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
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
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 hover:shadow-blue-500/60"
                >
                  <span className="relative z-10">Admin Login</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"></span>
                </Link>
                <Link
                  href="/super-admin"
                  className="rounded-full border-2 border-white/50 bg-white/10 px-8 py-5 text-base font-bold text-white backdrop-blur-md transition-all hover:border-white hover:bg-white/20 hover:scale-105"
                >
                  Super Admin →
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
        <div className="py-24 sm:py-32">

          {/* Features Grid */}
          <div className="mt-32">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-5xl font-black tracking-tight text-gray-900 sm:text-6xl">
                Everything you need
              </h2>
              <p className="mt-6 text-xl leading-8 text-gray-600">
                A complete platform for managing your restaurant&apos;s online presence
              </p>
            </div>
            <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-lg transition-all hover:scale-105 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="mb-6 text-5xl transition-transform group-hover:scale-110">💳</div>
                <h3 className="text-2xl font-bold text-gray-900">Stripe Payments</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Integrated Stripe Connect for secure payments with platform fees. Full webhook support for order processing.
                </p>
                <div className="mt-6 h-1 w-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all group-hover:w-full"></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-lg transition-all hover:scale-105 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="mb-6 text-5xl transition-transform group-hover:scale-110">📱</div>
                <h3 className="text-2xl font-bold text-gray-900">Menu Management</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Easy menu editor with image uploads, galleries, sections, and featured items. Real-time updates.
                </p>
                <div className="mt-6 h-1 w-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all group-hover:w-full"></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-lg transition-all hover:scale-105 hover:border-pink-200 hover:shadow-2xl hover:shadow-pink-500/10">
                <div className="mb-6 text-5xl transition-transform group-hover:scale-110">🚀</div>
                <h3 className="text-2xl font-bold text-gray-900">Fulfillment</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Real-time order tracking, kitchen dashboard, and auto-print integration for seamless operations.
                </p>
                <div className="mt-6 h-1 w-0 bg-gradient-to-r from-pink-600 to-red-600 transition-all group-hover:w-full"></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-lg transition-all hover:scale-105 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10">
                <div className="mb-6 text-5xl transition-transform group-hover:scale-110">🎨</div>
                <h3 className="text-2xl font-bold text-gray-900">Branding</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Custom logos, colors, hero images, and gallery rotation. Full control over your restaurant&apos;s look.
                </p>
                <div className="mt-6 h-1 w-0 bg-gradient-to-r from-indigo-600 to-blue-600 transition-all group-hover:w-full"></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-lg transition-all hover:scale-105 hover:border-green-200 hover:shadow-2xl hover:shadow-green-500/10">
                <div className="mb-6 text-5xl transition-transform group-hover:scale-110">👥</div>
                <h3 className="text-2xl font-bold text-gray-900">Multi-Tenant</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Manage multiple restaurants from one platform. Each tenant has isolated data and settings.
                </p>
                <div className="mt-6 h-1 w-0 bg-gradient-to-r from-green-600 to-emerald-600 transition-all group-hover:w-full"></div>
              </div>
              <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-10 shadow-lg transition-all hover:scale-105 hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-500/10">
                <div className="mb-6 text-5xl transition-transform group-hover:scale-110">📊</div>
                <h3 className="text-2xl font-bold text-gray-900">Analytics</h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Track orders, revenue, and customer data. Platform-wide metrics for super admins.
                </p>
                <div className="mt-6 h-1 w-0 bg-gradient-to-r from-amber-600 to-orange-600 transition-all group-hover:w-full"></div>
              </div>
            </div>
          </div>

          {/* Login Sections */}
          <div className="mt-32 grid gap-8 md:grid-cols-2">
            {/* Restaurant Owner Login */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-blue-50 p-10 shadow-xl transition-all hover:scale-105 hover:border-blue-300 hover:shadow-2xl">
              <div className="mb-6 text-5xl transition-transform group-hover:scale-110">🍽️</div>
              <h3 className="text-3xl font-bold text-gray-900">Restaurant Owner</h3>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Manage your restaurant&apos;s menu, orders, and settings. Access your admin dashboard to track sales and fulfill orders.
              </p>
              <div className="mt-8">
                <Link
                  href="/owner/login"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-105 hover:shadow-blue-500/50"
                >
                  Restaurant Login →
                </Link>
              </div>
              <div className="mt-6 text-sm text-gray-500">
                <p>Already have an account?</p>
                <Link href="/admin/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign in here
                </Link>
              </div>
            </div>

            {/* Associate Program */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-purple-50 p-10 shadow-xl transition-all hover:scale-105 hover:border-purple-300 hover:shadow-2xl">
              <div className="mb-6 text-5xl transition-transform group-hover:scale-110">👥</div>
              <h3 className="text-3xl font-bold text-gray-900">Become an Associate</h3>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Join our associate program and earn commissions by referring restaurants. Build your downline and grow your income.
              </p>
              <div className="mt-8">
                <Link
                  href="/associate/login"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:scale-105 hover:shadow-purple-500/50"
                >
                  Associate Login →
                </Link>
              </div>
              <div className="mt-6 text-sm text-gray-500">
                <p>New to the program?</p>
                <Link href="/associate/register" className="font-semibold text-purple-600 hover:text-purple-700">
                  Join as Associate
                </Link>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative mt-16 overflow-hidden rounded-4xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-8 py-24 sm:px-12 sm:py-32">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
                Ready to get started?
              </h2>
              <p className="mt-6 text-xl leading-8 text-blue-100 md:text-2xl">
                Contact us to set up your restaurant on the platform, or log in to manage your existing account.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                {isSuperAdmin ? (
                  <Link
                    href="/super-admin"
                    className="group relative overflow-hidden rounded-full bg-white px-10 py-5 text-lg font-bold text-blue-600 shadow-2xl transition-all hover:scale-105 hover:shadow-white/50"
                  >
                    <span className="relative z-10">Go to Dashboard</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 transition-opacity group-hover:opacity-100"></span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/owner/login"
                      className="group relative overflow-hidden rounded-full bg-white px-10 py-5 text-lg font-bold text-blue-600 shadow-2xl transition-all hover:scale-105 hover:shadow-white/50"
                    >
                      <span className="relative z-10">Restaurant Login</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 transition-opacity group-hover:opacity-100"></span>
                    </Link>
                    <Link
                      href="/super-admin"
                      className="rounded-full border-2 border-white/50 bg-white/10 px-8 py-5 text-base font-bold text-white backdrop-blur-md transition-all hover:border-white hover:bg-white/20 hover:scale-105"
                    >
                      Super Admin →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-xl text-white">
                ☁️
              </div>
              <span className="text-xl font-bold text-gray-900">Alessa Cloud</span>
            </div>
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Alessa Cloud. All rights reserved.</p>
            <p className="mt-2 text-sm text-gray-500">
              Multi-tenant restaurant ordering platform powered by Next.js, Stripe, and PostgreSQL.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

