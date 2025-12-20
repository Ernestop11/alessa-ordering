import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * Smart Dispatch Settings API
 *
 * POST /api/admin/delivery/smart-dispatch
 *
 * Body:
 * - enabled: boolean
 * - strategy: 'cheapest' | 'fastest'
 *
 * Updates the tenant's smart dispatch configuration.
 */

interface SmartDispatchRequest {
  enabled: boolean;
  strategy?: 'cheapest' | 'fastest';
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as SmartDispatchRequest;

    // Update tenant integration settings
    const integration = await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      update: {
        smartDispatchEnabled: body.enabled,
        smartDispatchStrategy: body.strategy || 'cheapest',
      },
      create: {
        tenantId: tenant.id,
        smartDispatchEnabled: body.enabled,
        smartDispatchStrategy: body.strategy || 'cheapest',
      },
    });

    // Log the change
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'smart_dispatch',
        message: body.enabled ? 'Smart Dispatch enabled' : 'Smart Dispatch disabled',
        payload: {
          enabled: body.enabled,
          strategy: body.strategy || 'cheapest',
        },
      },
    });

    return NextResponse.json({
      success: true,
      smartDispatchEnabled: integration.smartDispatchEnabled,
      smartDispatchStrategy: integration.smartDispatchStrategy,
    });
  } catch (error) {
    console.error('[Smart Dispatch Settings] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
      select: {
        smartDispatchEnabled: true,
        smartDispatchStrategy: true,
        uberOnboardingStatus: true,
        doordashOnboardingStatus: true,
      },
    });

    return NextResponse.json({
      smartDispatchEnabled: integration?.smartDispatchEnabled ?? false,
      smartDispatchStrategy: integration?.smartDispatchStrategy ?? 'cheapest',
      uberStatus: integration?.uberOnboardingStatus ?? 'not_connected',
      doordashStatus: integration?.doordashOnboardingStatus ?? 'not_connected',
    });
  } catch (error) {
    console.error('[Smart Dispatch Settings] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 }
    );
  }
}
