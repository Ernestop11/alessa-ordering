import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { resolveTenant } from '@/lib/tenant';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Dynamic favicon based on tenant
 *
 * Returns tenant-specific favicon if available,
 * otherwise returns default Alessa Cloud favicon.
 */
export async function GET() {
  try {
    const headersList = headers();
    const host = headersList.get('host') || '';

    // Resolve tenant from host directly
    const tenant = await resolveTenant({ host });
    const tenantSlug = tenant?.slug;

    if (tenantSlug) {
      // Try tenant-specific favicon
      const tenantFaviconPath = path.join(
        process.cwd(),
        'public',
        'tenant',
        tenantSlug,
        'favicon.ico'
      );

      try {
        const favicon = await fs.readFile(tenantFaviconPath);
        return new NextResponse(favicon, {
          headers: {
            'Content-Type': 'image/x-icon',
            'Cache-Control': 'public, max-age=86400', // 1 day
          },
        });
      } catch {
        // Tenant favicon not found, try logo as PNG
        const tenantLogoPaths = [
          path.join(process.cwd(), 'public', 'tenant', tenantSlug, 'images', 'logo.png'),
          path.join(process.cwd(), 'public', 'tenant', tenantSlug, 'logo.png'),
        ];

        for (const logoPath of tenantLogoPaths) {
          try {
            const logo = await fs.readFile(logoPath);
            return new NextResponse(logo, {
              headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400',
              },
            });
          } catch {
            // Continue to next path
          }
        }
      }
    }

    // Fall back to default favicon
    const defaultFaviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    try {
      const favicon = await fs.readFile(defaultFaviconPath);
      return new NextResponse(favicon, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      // No favicon found, return 404
      return new NextResponse(null, { status: 404 });
    }
  } catch (error) {
    console.error('[favicon] Error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
