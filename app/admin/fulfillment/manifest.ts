import { MetadataRoute } from 'next';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function fulfillmentManifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await requireTenant();
  
  return {
    name: `${tenant.name} - Kitchen Dashboard`,
    short_name: 'Kitchen',
    description: `Fulfillment dashboard for ${tenant.name}`,
    start_url: '/admin/fulfillment',
    scope: '/admin/fulfillment',
    display: 'standalone',
    orientation: 'landscape-primary',
    background_color: tenant.primaryColor || '#ffffff',
    theme_color: tenant.primaryColor || '#dc2626',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

