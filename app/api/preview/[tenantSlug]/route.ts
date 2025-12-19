import { NextRequest, NextResponse } from 'next/server'
import { getTemplateSettings } from '@/lib/template-renderer'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Preview API endpoint - Returns current template settings for a tenant
 * No authentication required - used by iframe for real-time preview updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> | { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = await Promise.resolve(params)

    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Fetch template settings
    const settings = await getTemplateSettings(tenant.id)

    // Return settings with timestamp for cache busting
    return NextResponse.json({
      data: settings,
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Preview API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preview data', details: error.message },
      { status: 500 }
    )
  }
}

