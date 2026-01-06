import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { sendEmail, generateTenantIncidentEmail, sendAdminAlert } from '@/lib/email/resend';

// GET - Get incident data for a tenant
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const action = searchParams.get('action');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  try {
    // Try to find tenant by ID first, then by slug
    let tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        contactPhone: true,
      },
    });

    // If not found by ID, try by slug
    if (!tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          contactEmail: true,
          contactPhone: true,
        },
      });
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get payment sessions for this tenant
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const paymentSessions = await prisma.paymentSession.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingSessions = paymentSessions.filter(s => s.status === 'pending');
    const completedSessions = paymentSessions.filter(s => s.status === 'completed');

    // Group affected customers
    const customerMap = new Map<string, {
      name: string;
      email: string | null;
      phone: string | null;
      attempts: number;
      totalLost: number;
      lastAttempt: Date;
    }>();

    pendingSessions.forEach(session => {
      const data = session.orderData as {
        customerName?: string;
        customerEmail?: string;
        customerPhone?: string;
      } | null;

      const name = data?.customerName || 'Unknown';
      // Skip test entries
      if (name.toLowerCase().includes('test') || name.toLowerCase().includes('debug')) {
        return;
      }

      const email = data?.customerEmail || 'unknown';
      const key = email;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name,
          email: data?.customerEmail || null,
          phone: data?.customerPhone || null,
          attempts: 0,
          totalLost: 0,
          lastAttempt: session.createdAt,
        });
      }

      const customer = customerMap.get(key)!;
      customer.attempts++;
      customer.totalLost += session.amount / 100;
      if (session.createdAt > customer.lastAttempt) {
        customer.lastAttempt = session.createdAt;
      }
    });

    const affectedCustomers = Array.from(customerMap.values())
      .filter(c => c.name !== 'Unknown')
      .sort((a, b) => b.totalLost - a.totalLost);

    const successRate = (pendingSessions.length + completedSessions.length) > 0
      ? (completedSessions.length / (pendingSessions.length + completedSessions.length)) * 100
      : 100;

    // Generate email preview if requested
    if (action === 'preview') {
      const emailData = generateTenantIncidentEmail({
        tenantName: tenant.name,
        ownerName: 'Restaurant Owner', // Will be customized before sending
        incidentDate: 'December 30, 2025 - January 6, 2026',
        affectedCustomers: affectedCustomers.map(c => ({
          ...c,
          lastAttempt: c.lastAttempt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        })),
        rootCause: 'A technical issue with our checkout system caused the shopping cart to appear empty when customers tried to complete their orders. This was due to a synchronization problem between our cart storage and checkout page.',
        resolution: 'Our engineering team identified and fixed the issue. The checkout system is now working correctly, and all cart data is properly synchronized.',
        preventionSteps: [
          'Implemented real-time monitoring dashboard for checkout success rates',
          'Added automated alerts when success rate drops below threshold',
          'Created customer contact list for rapid incident response',
          'Enhanced testing procedures for cart and checkout flows',
        ],
      });

      return NextResponse.json({
        tenant,
        affectedCustomers,
        failureCount: pendingSessions.length,
        successRate,
        emailPreview: emailData,
      });
    }

    return NextResponse.json({
      tenant,
      affectedCustomers: affectedCustomers.map(c => ({
        ...c,
        lastAttempt: c.lastAttempt.toISOString(),
      })),
      failureCount: pendingSessions.length,
      completedCount: completedSessions.length,
      successRate,
      totalLost: affectedCustomers.reduce((sum, c) => sum + c.totalLost, 0),
    });
  } catch (error) {
    console.error('[incidents] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get incident data' },
      { status: 500 }
    );
  }
}

// POST - Send incident email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      action,
      tenantId,
      recipientEmail,
      recipientName,
      rootCause,
      resolution,
      preventionSteps,
      incidentDate,
    } = body;

    if (action === 'send_admin_alert') {
      // Send alert to super admin
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, slug: true },
      });

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      const result = await sendAdminAlert({
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        failureCount: body.failureCount || 0,
        affectedCustomers: body.affectedCustomers || [],
        successRate: body.successRate || 0,
        timeframe: body.timeframe || 'Last 24 hours',
      });

      return NextResponse.json(result);
    }

    if (action === 'send_tenant_report') {
      // Validate required fields
      if (!tenantId || !recipientEmail || !recipientName) {
        return NextResponse.json(
          { error: 'Missing required fields: tenantId, recipientEmail, recipientName' },
          { status: 400 }
        );
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, slug: true },
      });

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      // Get affected customers
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const pendingSessions = await prisma.paymentSession.findMany({
        where: {
          tenantId,
          status: 'pending',
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      const customerMap = new Map<string, {
        name: string;
        email: string | null;
        phone: string | null;
        attempts: number;
        totalLost: number;
        lastAttempt: Date;
      }>();

      pendingSessions.forEach(session => {
        const data = session.orderData as {
          customerName?: string;
          customerEmail?: string;
          customerPhone?: string;
        } | null;

        const name = data?.customerName || 'Unknown';
        if (name.toLowerCase().includes('test') || name.toLowerCase().includes('debug')) {
          return;
        }

        const email = data?.customerEmail || 'unknown';
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            name,
            email: data?.customerEmail || null,
            phone: data?.customerPhone || null,
            attempts: 0,
            totalLost: 0,
            lastAttempt: session.createdAt,
          });
        }

        const customer = customerMap.get(email)!;
        customer.attempts++;
        customer.totalLost += session.amount / 100;
        if (session.createdAt > customer.lastAttempt) {
          customer.lastAttempt = session.createdAt;
        }
      });

      const affectedCustomers = Array.from(customerMap.values())
        .filter(c => c.name !== 'Unknown')
        .map(c => ({
          ...c,
          lastAttempt: c.lastAttempt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        }));

      // Generate and send email
      const emailData = generateTenantIncidentEmail({
        tenantName: tenant.name,
        ownerName: recipientName,
        incidentDate: incidentDate || 'Recent',
        affectedCustomers,
        rootCause: rootCause || 'A technical issue affected the checkout process.',
        resolution: resolution || 'The issue has been identified and resolved.',
        preventionSteps: preventionSteps || [
          'Implemented monitoring for checkout failures',
          'Added automated alerts',
          'Enhanced testing procedures',
        ],
      });

      const result = await sendEmail({
        to: recipientEmail,
        subject: emailData.subject,
        html: emailData.html,
      });

      // Log the email send
      await prisma.integrationLog.create({
        data: {
          tenantId,
          source: 'incident-email',
          message: result.success
            ? `Incident report sent to ${recipientEmail}`
            : `Failed to send incident report to ${recipientEmail}`,
          payload: {
            recipientEmail,
            recipientName,
            affectedCustomersCount: affectedCustomers.length,
            success: result.success,
            error: result.error || null,
          },
        },
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[incidents] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
