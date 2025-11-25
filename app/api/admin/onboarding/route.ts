import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenant = await requireTenant();

  const tenantRecord = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    include: {
      integrations: true,
      menuItems: { select: { id: true }, take: 1 },
      settings: { select: { isOpen: true } },
    },
  });

  if (!tenantRecord) {
    return NextResponse.json(
      {
        tenantName: tenant.name,
        completedCount: 0,
        totalCount: 0,
        items: [],
      },
      { status: 200 },
    );
  }

  const integrations = tenantRecord.integrations;

  const hasStripe =
    Boolean(integrations?.stripeAccountId) &&
    Boolean(integrations?.stripePayoutsEnabled) &&
    Boolean(integrations?.stripeChargesEnabled);

  const hasDeliveryIntegration = Boolean(integrations?.doorDashStoreId || integrations?.doorDashOAuthToken);

  const hasPrinter =
    Boolean(integrations?.printerEndpoint) ||
    Boolean(integrations?.printerConfig) ||
    Boolean(integrations?.cloverMerchantId);

  const hasMenu = tenantRecord.menuItems.length > 0;

  const items = [
    {
      id: 'stripe',
      title: 'Connect Stripe',
      description: 'Enable payments so funds are deposited directly into your account.',
      actionLabel: hasStripe ? 'Review settings' : 'Connect Stripe',
      actionHref: '/admin/settings#payments',
      completed: hasStripe,
      docsUrl: 'https://stripe.com/docs/connect',
    },
    {
      id: 'delivery',
      title: 'Configure delivery provider',
      description: 'Choose DoorDash or mark your restaurant as pickup only.',
      actionLabel: hasDeliveryIntegration ? 'Manage delivery' : 'Set up delivery',
      actionHref: '/admin/settings#delivery',
      completed: hasDeliveryIntegration,
      docsUrl: '/docs/DOORDASH_INTEGRATION.md',
    },
    {
      id: 'printer',
      title: 'Set up order printing',
      description: 'Provide a printer endpoint or Clover credentials so kitchen tickets print automatically.',
      actionLabel: hasPrinter ? 'Manage printers' : 'Connect printer',
      actionHref: '/admin/settings#printers',
      completed: hasPrinter,
      docsUrl: '/docs/PRINTER_SETUP_GUIDE.md',
    },
    {
      id: 'menu',
      title: 'Publish your menu',
      description: 'Add at least one menu item so customers can start placing orders.',
      actionLabel: hasMenu ? 'Review menu' : 'Add menu items',
      actionHref: hasMenu ? '/admin/menu-manager' : '/admin/menu-manager',
      completed: hasMenu,
      docsUrl: '/docs/QUICK_START_DEPLOYMENT.md',
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;

  return NextResponse.json({
    tenantName: tenantRecord.name,
    completedCount,
    totalCount: items.length,
    items,
  });
}

