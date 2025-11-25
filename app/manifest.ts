import { MetadataRoute } from 'next';
import { getStaticTenantTheme } from '../lib/tenant-theme-map';

const defaultTheme = getStaticTenantTheme();

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alessa Cloud',
    short_name: 'Alessa',
    description: 'Multi-tenant restaurant ordering platform by Alessa Cloud.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: defaultTheme.secondaryColor,
    theme_color: defaultTheme.themeColor,
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
}
