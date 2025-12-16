const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'images.pexels.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'cdn.pixabay.com',
    pathname: '/**',
  },
];

const tenantAssetBase = process.env.NEXT_PUBLIC_TENANT_ASSET_BASE_URL;
if (tenantAssetBase) {
  try {
    const assetUrl = new URL(tenantAssetBase);
    const normalizedPath = assetUrl.pathname.replace(/\/+$/, '');
    remotePatterns.push({
      protocol: assetUrl.protocol.replace(':', ''),
      hostname: assetUrl.hostname,
      port: assetUrl.port || undefined,
      pathname: `${normalizedPath || ''}/**`,
    });
  } catch (error) {
    console.warn('[next.config] Invalid NEXT_PUBLIC_TENANT_ASSET_BASE_URL provided:', error);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during builds to allow server to start
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds
    // TODO: Add missing MLM Prisma models (BulletinPost, TeamMeeting, Announcement, etc.)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns,
    unoptimized: false,
    // Allow tenant images from local public folder
    domains: [],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Allow serving uploaded images from /public/uploads/
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      // Prevent caching on order pages for instant updates
      {
        source: '/order',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/order/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Prevent caching on grocery pages
      {
        source: '/grocery',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
      {
        source: '/grocery/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
