import prisma from '@/lib/prisma';
import { resendClient, getTenantFromEmail } from '@/lib/notifications/providers';
import { generateCDTFAReturnData, generateCDTFAReturnHTML } from './cdtfa-return-generator';

/**
 * Send a filing reminder email to the tenant admin.
 * Includes pre-filled return data and link to CDTFA portal.
 */
export async function sendFilingReminder(
  tenantId: string,
  filingPeriodId: string,
  daysUntilDeadline: number
): Promise<boolean> {
  if (!resendClient) {
    console.warn('[Tax Notifications] Resend client not configured');
    return false;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      contactEmail: true,
      customDomain: true,
      emailDomainVerified: true,
    },
  });

  if (!tenant?.contactEmail) {
    console.warn(`[Tax Notifications] No contact email for tenant ${tenantId}`);
    return false;
  }

  const period = await prisma.taxFilingPeriod.findFirst({
    where: { id: filingPeriodId, tenantId },
  });

  if (!period) {
    console.warn(`[Tax Notifications] Filing period ${filingPeriodId} not found`);
    return false;
  }

  try {
    const returnData = await generateCDTFAReturnData(tenantId, filingPeriodId);
    const returnHTML = generateCDTFAReturnHTML(returnData);

    const urgency =
      daysUntilDeadline <= 7
        ? 'URGENT: '
        : daysUntilDeadline <= 14
          ? 'Reminder: '
          : '';

    const quarterLabel = returnData.quarterLabel;
    const subject = `${urgency}Sales Tax Return Due in ${daysUntilDeadline} Days — ${quarterLabel}`;

    const fromEmail = getTenantFromEmail({
      tenantName: 'Alessa Tax',
      customDomain: tenant.customDomain,
      emailDomainVerified: tenant.emailDomainVerified,
    });

    const fmt = (n: number) =>
      `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    await resendClient.emails.send({
      from: fromEmail,
      to: tenant.contactEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #065f46; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">Sales Tax Filing Reminder</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">${tenant.name} — ${quarterLabel}</p>
          </div>

          <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb;">
            <p>Your California sales tax return is due in <strong>${daysUntilDeadline} days</strong> (by ${returnData.filingDeadline}).</p>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Total Tax Due:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px; color: #065f46;">${fmt(returnData.line10_totalTaxDue)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Escrow Balance:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${fmt(returnData.line11_prepayments)}</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280;">Net Amount Due:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${returnData.line12_netAmountDue > 0 ? '#dc2626' : '#059669'};">${fmt(returnData.line12_netAmountDue)}</td>
                </tr>
              </table>
            </div>

            <p style="margin-top: 16px;">Your pre-filled return summary is attached below. Please review and file at:</p>

            <a href="https://onlineservices.cdtfa.ca.gov/" style="display: inline-block; background: #065f46; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 8px 0;">
              File at CDTFA Portal →
            </a>

            <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
              After filing, mark your return as "Filed" in your Alessa dashboard. The system will then automatically initiate payment.
            </p>
          </div>

          <div style="padding: 16px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h3 style="margin: 0 0 12px; color: #065f46;">Pre-Filled Return Summary</h3>
            ${returnHTML}
          </div>

          <div style="padding: 12px; text-align: center; font-size: 12px; color: #9ca3af;">
            Sent by Alessa Auto Sales Tax. This is an automated reminder — verify all amounts before filing.
          </div>
        </div>
      `,
    });

    console.log(
      `[Tax Notifications] Filing reminder sent to ${tenant.contactEmail} for period ${filingPeriodId} (${daysUntilDeadline} days until deadline)`
    );
    return true;
  } catch (error: any) {
    console.error('[Tax Notifications] Failed to send filing reminder:', error);
    return false;
  }
}

/**
 * Check all tenants for upcoming filing deadlines and send reminders.
 * Called by the weekly cron job.
 * Sends reminders at 30, 14, and 7 days before deadline.
 */
export async function checkUpcomingDeadlines(): Promise<{
  checked: number;
  reminders: number;
  errors: number;
}> {
  const now = new Date();
  const thirtyDaysOut = new Date(now);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 31);

  // Find filing periods with deadlines in the next 31 days
  // that haven't been filed yet
  const periods = await prisma.taxFilingPeriod.findMany({
    where: {
      filingDeadline: { gte: now, lte: thirtyDaysOut },
      filingStatus: { in: ['accumulating', 'ready_to_file', 'filing_prepared'] },
    },
    include: {
      tenant: {
        include: { integrations: true },
      },
    },
  });

  let reminders = 0;
  let errors = 0;

  for (const period of periods) {
    if (!period.tenant.integrations?.taxAutoSetAsideEnabled) continue;

    const daysUntil = Math.ceil(
      (period.filingDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send at 30, 14, and 7 day marks
    const shouldSend = daysUntil === 30 || daysUntil === 14 || daysUntil === 7 ||
      daysUntil <= 3; // daily reminders in last 3 days

    if (shouldSend) {
      try {
        const sent = await sendFilingReminder(period.tenantId, period.id, daysUntil);
        if (sent) reminders++;
      } catch (error: any) {
        console.error(`[Tax Notifications] Error for period ${period.id}:`, error);
        errors++;
      }
    }
  }

  return { checked: periods.length, reminders, errors };
}

/**
 * Ensure filing periods exist for the current and upcoming quarter.
 * Called by the cron job to auto-create periods.
 */
export async function ensureFilingPeriods(tenantId: string): Promise<void> {
  const integration = await prisma.tenantIntegration.findUnique({
    where: { tenantId },
  });

  if (!integration?.taxAutoSetAsideEnabled) return;

  const state = integration.taxFilingState ?? 'CA';
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // CA quarterly deadlines
  const quarterDeadlines: Record<number, { start: string; end: string; deadline: string }> = {
    1: { start: `${currentYear}-01-01`, end: `${currentYear}-03-31`, deadline: `${currentYear}-04-30` },
    2: { start: `${currentYear}-04-01`, end: `${currentYear}-06-30`, deadline: `${currentYear}-07-31` },
    3: { start: `${currentYear}-07-01`, end: `${currentYear}-09-30`, deadline: `${currentYear}-10-31` },
    4: { start: `${currentYear}-10-01`, end: `${currentYear}-12-31`, deadline: `${currentYear + 1}-01-31` },
  };

  // Create current quarter and next quarter
  for (const q of [currentQuarter, currentQuarter < 4 ? currentQuarter + 1 : 1]) {
    const year = q <= currentQuarter && q === 1 && currentQuarter === 4 ? currentYear + 1 : currentYear;
    const deadlineData = quarterDeadlines[q];

    if (!deadlineData) continue;

    const existing = await prisma.taxFilingPeriod.findFirst({
      where: { tenantId, state, year, quarter: q },
    });

    if (!existing) {
      await prisma.taxFilingPeriod.create({
        data: {
          tenantId,
          state,
          year,
          quarter: q,
          periodStart: new Date(deadlineData.start),
          periodEnd: new Date(deadlineData.end),
          filingDeadline: new Date(deadlineData.deadline),
          filingStatus: 'accumulating',
          paymentStatus: 'pending',
        },
      });

      console.log(`[Tax Filing] Created Q${q} ${year} period for tenant ${tenantId}`);
    }
  }
}
