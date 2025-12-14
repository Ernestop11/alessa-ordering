import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

/**
 * Marketing Image Generator API
 *
 * Generates social media post images for weekend specials
 * Overlays product image on branded template background
 *
 * Usage:
 * POST /api/marketing/generate-post
 * Body: {
 *   productId: string,
 *   templateStyle: 'default' | 'bold' | 'minimal',
 *   platform: 'instagram' | 'facebook' | 'twitter'
 * }
 */

interface GeneratePostRequest {
  productId: string;
  templateStyle?: 'default' | 'bold' | 'minimal';
  platform?: 'instagram' | 'facebook' | 'twitter';
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    // Require admin auth
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GeneratePostRequest = await req.json();
    const { productId, templateStyle = 'default', platform = 'instagram' } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Get product data from weekend specials
    const { default: prisma } = await import('@/lib/prisma');
    const product = await prisma.groceryItem.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate dimensions based on platform
    const dimensions = getDimensions(platform);

    // Generate canvas-based image
    const imageUrl = await generateMarketingImage({
      product,
      templateStyle,
      dimensions,
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        weekendPrice: product.weekendPrice,
      },
      metadata: {
        platform,
        templateStyle,
        dimensions,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Marketing API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate marketing image',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getDimensions(platform: string) {
  const sizes = {
    instagram: { width: 1080, height: 1080 }, // Square
    facebook: { width: 1200, height: 630 }, // Landscape
    twitter: { width: 1200, height: 675 }, // 16:9
  };
  return sizes[platform as keyof typeof sizes] || sizes.instagram;
}

async function generateMarketingImage({
  product,
  templateStyle,
  dimensions,
}: {
  product: any;
  templateStyle: string;
  dimensions: { width: number; height: number };
}) {
  // For now, return a URL to a template-based image generator service
  // This can be replaced with actual Canvas rendering or integration with Canva API

  const savings = product.weekendPrice
    ? Math.round(((product.price - product.weekendPrice) / product.price) * 100)
    : 0;

  // Return a data URL or template URL that can be used by external services
  // In production, this would call Canva API or render with node-canvas
  const params = new URLSearchParams({
    name: product.name,
    price: product.price.toString(),
    weekendPrice: product.weekendPrice?.toString() || product.price.toString(),
    savings: savings.toString(),
    image: product.image || '',
    template: templateStyle,
    width: dimensions.width.toString(),
    height: dimensions.height.toString(),
  });

  // Return placeholder URL for now
  // TODO: Integrate with actual image generation service
  return `/api/marketing/render?${params.toString()}`;
}

/**
 * GET endpoint to retrieve available templates and products
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'templates') {
      return NextResponse.json({
        templates: [
          {
            id: 'default',
            name: 'Default Weekend Special',
            description: 'Yellow/orange gradient with product showcase',
            preview: '/templates/default-preview.png',
          },
          {
            id: 'bold',
            name: 'Bold Sale Banner',
            description: 'High contrast red background with large savings badge',
            preview: '/templates/bold-preview.png',
          },
          {
            id: 'minimal',
            name: 'Minimal Clean',
            description: 'White background with product focus',
            preview: '/templates/minimal-preview.png',
          },
        ],
      });
    }

    if (action === 'products') {
      const { default: prisma } = await import('@/lib/prisma');
      const { requireTenant } = await import('@/lib/tenant');
      const tenant = await requireTenant();

      const weekendSpecials = await prisma.groceryItem.findMany({
        where: {
          tenantId: tenant.id,
          isWeekendSpecial: true,
          available: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          weekendPrice: true,
          image: true,
          unit: true,
        },
      });

      return NextResponse.json({
        products: weekendSpecials,
        count: weekendSpecials.length,
      });
    }

    return NextResponse.json({
      message: 'Marketing Image Generator API',
      endpoints: {
        generatePost: 'POST /api/marketing/generate-post',
        templates: 'GET /api/marketing/generate-post?action=templates',
        products: 'GET /api/marketing/generate-post?action=products',
      },
      integration: {
        alessaSocialMarketing: 'https://social.alessacloud.com',
        smpSync: '/api/smp/grocery/weekend-specials',
      },
    });
  } catch (error) {
    console.error('[Marketing API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
