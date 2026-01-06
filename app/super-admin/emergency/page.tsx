import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import EmergencyDashboard from '@/components/super/EmergencyDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PaymentSessionWithTenant {
  id: string;
  tenantId: string;
  status: string;
  amount: number;
  createdAt: Date;
  orderData: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    items?: Array<{ name?: string; quantity?: number; price?: number }>;
    fulfillmentMethod?: string;
  } | null;
  tenant: {
    name: string;
    slug: string;
  };
}

export default async function EmergencyPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    redirect('/admin/login');
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get all payment sessions for analysis
  const [
    allPaymentSessions,
    recentOrders,
    integrationLogs,
  ] = await Promise.all([
    prisma.paymentSession.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        tenant: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        tenant: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.integrationLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        OR: [
          { message: { contains: 'error', mode: 'insensitive' } },
          { message: { contains: 'fail', mode: 'insensitive' } },
        ],
      },
      include: {
        tenant: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  // Calculate metrics
  const pendingSessions = allPaymentSessions.filter(s => s.status === 'pending');
  const completedSessions = allPaymentSessions.filter(s => s.status === 'completed');

  // Group by tenant for analysis
  const tenantMetrics = new Map<string, {
    tenantName: string;
    tenantSlug: string;
    pending: number;
    completed: number;
    pendingAmount: number;
    completedAmount: number;
    successRate: number;
    last24hPending: number;
    last24hCompleted: number;
  }>();

  allPaymentSessions.forEach(session => {
    const existing = tenantMetrics.get(session.tenantId) || {
      tenantName: session.tenant.name,
      tenantSlug: session.tenant.slug,
      pending: 0,
      completed: 0,
      pendingAmount: 0,
      completedAmount: 0,
      successRate: 0,
      last24hPending: 0,
      last24hCompleted: 0,
    };

    if (session.status === 'pending') {
      existing.pending++;
      existing.pendingAmount += session.amount / 100;
      if (session.createdAt >= twentyFourHoursAgo) {
        existing.last24hPending++;
      }
    } else if (session.status === 'completed') {
      existing.completed++;
      existing.completedAmount += session.amount / 100;
      if (session.createdAt >= twentyFourHoursAgo) {
        existing.last24hCompleted++;
      }
    }

    tenantMetrics.set(session.tenantId, existing);
  });

  // Calculate success rates
  tenantMetrics.forEach((metrics, tenantId) => {
    const total = metrics.pending + metrics.completed;
    metrics.successRate = total > 0 ? (metrics.completed / total) * 100 : 100;
    tenantMetrics.set(tenantId, metrics);
  });

  // Get affected customers with contact info
  const affectedCustomers = pendingSessions
    .filter(s => {
      const data = s.orderData as PaymentSessionWithTenant['orderData'];
      const name = data?.customerName || '';
      return !name.toLowerCase().includes('test') &&
             !name.toLowerCase().includes('debug') &&
             !name.toLowerCase().includes('final');
    })
    .reduce((acc, session) => {
      const data = session.orderData as PaymentSessionWithTenant['orderData'];
      const email = data?.customerEmail || 'unknown';

      if (!acc.has(email)) {
        acc.set(email, {
          name: data?.customerName || 'Unknown',
          email: data?.customerEmail || null,
          phone: data?.customerPhone || null,
          tenantName: session.tenant.name,
          tenantSlug: session.tenant.slug,
          attempts: 0,
          totalLost: 0,
          firstAttempt: session.createdAt,
          lastAttempt: session.createdAt,
          items: [],
        });
      }

      const customer = acc.get(email)!;
      customer.attempts++;
      customer.totalLost += session.amount / 100;
      if (session.createdAt < customer.firstAttempt) {
        customer.firstAttempt = session.createdAt;
      }
      if (session.createdAt > customer.lastAttempt) {
        customer.lastAttempt = session.createdAt;
      }

      // Add items from this attempt
      const items = data?.items || [];
      items.forEach(item => {
        if (item.name && !customer.items.includes(item.name)) {
          customer.items.push(item.name);
        }
      });

      return acc;
    }, new Map<string, {
      name: string;
      email: string | null;
      phone: string | null;
      tenantName: string;
      tenantSlug: string;
      attempts: number;
      totalLost: number;
      firstAttempt: Date;
      lastAttempt: Date;
      items: string[];
    }>());

  // Overall health metrics
  const totalPending = pendingSessions.length;
  const totalCompleted = completedSessions.length;
  const overallSuccessRate = (totalPending + totalCompleted) > 0
    ? (totalCompleted / (totalPending + totalCompleted)) * 100
    : 100;

  const last24hPending = pendingSessions.filter(s => s.createdAt >= twentyFourHoursAgo).length;
  const last24hCompleted = completedSessions.filter(s => s.createdAt >= twentyFourHoursAgo).length;
  const last24hSuccessRate = (last24hPending + last24hCompleted) > 0
    ? (last24hCompleted / (last24hPending + last24hCompleted)) * 100
    : 100;

  // Determine alert level
  let alertLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (last24hSuccessRate < 50) {
    alertLevel = 'critical';
  } else if (last24hSuccessRate < 80 || last24hPending > 5) {
    alertLevel = 'warning';
  }

  const dashboardData = {
    alertLevel,
    lastUpdated: new Date().toISOString(),
    overall: {
      successRate: overallSuccessRate,
      totalPending,
      totalCompleted,
      pendingAmount: pendingSessions.reduce((sum, s) => sum + s.amount / 100, 0),
      completedAmount: completedSessions.reduce((sum, s) => sum + s.amount / 100, 0),
    },
    last24h: {
      successRate: last24hSuccessRate,
      pending: last24hPending,
      completed: last24hCompleted,
    },
    tenantMetrics: Array.from(tenantMetrics.values()).sort((a, b) => a.successRate - b.successRate),
    affectedCustomers: Array.from(affectedCustomers.values())
      .sort((a, b) => b.totalLost - a.totalLost)
      .map(c => ({
        ...c,
        firstAttempt: c.firstAttempt.toISOString(),
        lastAttempt: c.lastAttempt.toISOString(),
      })),
    recentFailures: pendingSessions.slice(0, 20).map(s => {
      const data = s.orderData as PaymentSessionWithTenant['orderData'];
      return {
        id: s.id,
        tenantName: s.tenant.name,
        customerName: data?.customerName || 'Unknown',
        amount: s.amount / 100,
        createdAt: s.createdAt.toISOString(),
        items: data?.items?.map(i => i.name).filter(Boolean) || [],
      };
    }),
    errorLogs: integrationLogs.map(log => ({
      id: log.id,
      tenantName: log.tenant.name,
      source: log.source,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
    })),
    recentOrders: recentOrders.slice(0, 10).map(o => ({
      id: o.id,
      tenantName: o.tenant.name,
      customerName: o.customerName || 'Unknown',
      amount: Number(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  };

  return <EmergencyDashboard data={dashboardData} />;
}
