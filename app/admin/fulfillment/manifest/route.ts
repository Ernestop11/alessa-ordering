import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenant = await requireTenant();
    
    const manifest = {
      name: `${tenant.name} - Kitchen Dashboard`,
      short_name: 'Kitchen',
      description: `Fulfillment dashboard for ${tenant.name}`,
      start_url: `/admin/fulfillment?tenant=${tenant.slug}`,
      scope: '/', // Root scope allows API calls to /api/*
      display: 'standalone',
      orientation: 'landscape-primary',
      background_color: tenant.primaryColor || '#ffffff',
      theme_color: tenant.primaryColor || '#dc2626',
      icons: [
        {
          src: '/icons/alessa-cloud-icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/icons/alessa-cloud-icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Manifest] Error generating manifest:', error);
    return NextResponse.json({ error: 'Failed to generate manifest' }, { status: 500 });
  }
}




















