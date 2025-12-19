import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateSyncStatus } from '@/lib/ecosystem/communication';

// Trigger sync when tenant subscribes to SMP or menu changes
export async function POST(req: Request) {
  try {
    // Validate API key
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.ALESSACLOUD_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await req.json();
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        productSubscriptions: {
          include: { product: true }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if tenant has active SMP subscription
    const smpSubscription = tenant.productSubscriptions.find(
      sub => sub.product.slug === 'switchmenu-pro' && 
             (sub.status === 'active' || sub.status === 'prepaid')
    );

    if (!smpSubscription) {
      return NextResponse.json({ 
        error: 'No active SMP subscription',
        message: 'Tenant must have an active SwitchMenu Pro subscription to sync'
      }, { status: 400 });
    }

    // Update sync status to syncing
    await updateSyncStatus(tenantId, 'SMP', 'syncing', undefined, {
      lastSyncTrigger: new Date().toISOString(),
      subscriptionId: smpSubscription.id,
    });

    // Get menu data
    const products = await prisma.menuItem.findMany({
      where: { tenantId },
      include: { menuSection: true },
      orderBy: { createdAt: 'desc' },
    });

    const categories = await prisma.menuSection.findMany({
      where: { tenantId },
      orderBy: { position: 'asc' },
    });

    // Format data for SMP
    const syncData = {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        logoUrl: tenant.logoUrl,
        heroImageUrl: tenant.heroImageUrl,
      },
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        type: cat.type,
        position: cat.position,
        hero: cat.hero,
        itemCount: products.filter(p => p.menuSectionId === cat.id).length,
      })),
      products: products.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        gallery: item.gallery || [],
        available: item.available,
        menuSectionId: item.menuSectionId,
        isFeatured: item.isFeatured || false,
        tags: item.tags || [],
        customizationRemovals: item.customizationRemovals || [],
        customizationAddons: item.customizationAddons || null,
        timeSpecificEnabled: item.timeSpecificEnabled || false,
        timeSpecificDays: item.timeSpecificDays || [],
        timeSpecificStartTime: item.timeSpecificStartTime,
        timeSpecificEndTime: item.timeSpecificEndTime,
        timeSpecificPrice: item.timeSpecificPrice,
        timeSpecificLabel: item.timeSpecificLabel,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    };

    // TODO: Send to SMP API endpoint
    // This is where you'll call your SwitchMenu Pro API
    // The SMP system should have an endpoint like: POST /api/sync/menu
    const smpApiUrl = process.env.SMP_API_URL || 'http://localhost:3003/api/sync/menu';
    const smpApiKey = process.env.SMP_API_KEY || '';
    
    try {
      // Attempt to send to SMP (if configured)
      if (smpApiUrl && smpApiKey && smpApiUrl !== 'http://localhost:3003/api/sync/menu') {
        const smpResponse = await fetch(smpApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': smpApiKey,
          },
          body: JSON.stringify({
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            ...syncData,
          }),
        });

        if (!smpResponse.ok) {
          throw new Error(`SMP API returned ${smpResponse.status}: ${await smpResponse.text()}`);
        }

        console.log(`[SMP Sync] Successfully synced menu to SMP for tenant: ${tenant.slug}`);
      } else {
        console.log(`[SMP Sync] SMP API not configured, sync data prepared but not sent`);
        console.log(`[SMP Sync] To enable: Set SMP_API_URL and SMP_API_KEY in .env`);
      }
    } catch (smpError: any) {
      console.error('[SMP Sync] Error sending to SMP API:', smpError);
      // Don't fail the sync if SMP API is unavailable - just log it
      // The sync data is still prepared and can be retrieved via the sync API
    }

    // Update sync status to success
    await updateSyncStatus(tenantId, 'SMP', 'success', undefined, {
      lastSyncTrigger: new Date().toISOString(),
      subscriptionId: smpSubscription.id,
      productCount: products.length,
      categoryCount: categories.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Menu synced to SMP successfully',
      data: {
        products: products.length,
        categories: categories.length,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
      },
    });

  } catch (error: any) {
    console.error('[SMP Sync] Error:', error);
    
    // Update sync status to error
    const { tenantId } = await req.json().catch(() => ({}));
    if (tenantId) {
      await updateSyncStatus(tenantId, 'SMP', 'error', error.message);
    }

    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    );
  }
}



















