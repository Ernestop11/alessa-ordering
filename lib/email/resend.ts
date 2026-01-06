import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email addresses
export const SUPPORT_EMAIL = 'support@alessacloud.com';
export const ALERTS_EMAIL = 'alerts@alessacloud.com';
export const FROM_EMAIL = 'AlessaCloud <noreply@alessacloud.com>';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Resend] API key not configured');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || SUPPORT_EMAIL,
    });

    console.log('[Resend] Email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send alert to super admin when checkout failures detected
export async function sendAdminAlert(data: {
  tenantName: string;
  tenantSlug: string;
  failureCount: number;
  affectedCustomers: Array<{
    name: string;
    email: string | null;
    phone: string | null;
    attempts: number;
    totalLost: number;
  }>;
  successRate: number;
  timeframe: string;
}) {
  const customerRows = data.affectedCustomers
    .map(c => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.email || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.phone || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.attempts}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">$${c.totalLost.toFixed(2)}</td>
      </tr>
    `)
    .join('');

  const totalLost = data.affectedCustomers.reduce((sum, c) => sum + c.totalLost, 0);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- Alert Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">CHECKOUT FAILURE ALERT</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${data.tenantName} (${data.tenantSlug})</p>
    </div>

    <!-- Stats -->
    <div style="padding: 24px; background: #fef2f2; border-bottom: 1px solid #fecaca;">
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${data.failureCount}</div>
          <div style="font-size: 12px; color: #991b1b; text-transform: uppercase;">Failed Payments</div>
        </div>
        <div>
          <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${data.successRate.toFixed(1)}%</div>
          <div style="font-size: 12px; color: #991b1b; text-transform: uppercase;">Success Rate</div>
        </div>
        <div>
          <div style="font-size: 32px; font-weight: bold; color: #dc2626;">$${totalLost.toFixed(2)}</div>
          <div style="font-size: 12px; color: #991b1b; text-transform: uppercase;">Revenue Lost</div>
        </div>
      </div>
    </div>

    <!-- Affected Customers -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Affected Customers</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Name</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Email</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Phone</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Attempts</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Lost</th>
          </tr>
        </thead>
        <tbody>
          ${customerRows}
        </tbody>
      </table>
    </div>

    <!-- Action Required -->
    <div style="padding: 24px; background: #fffbeb; border-top: 1px solid #fcd34d;">
      <h3 style="margin: 0 0 12px 0; color: #92400e;">Action Required</h3>
      <ol style="margin: 0; padding-left: 20px; color: #78350f;">
        <li style="margin-bottom: 8px;">Review the Emergency Dashboard for full details</li>
        <li style="margin-bottom: 8px;">Contact affected customers to recover lost sales</li>
        <li style="margin-bottom: 8px;">Investigate root cause in error logs</li>
        <li style="margin-bottom: 8px;">Send apology email to affected customers once resolved</li>
      </ol>
    </div>

    <!-- Dashboard Link -->
    <div style="padding: 24px; text-align: center;">
      <a href="https://alessacloud.com/super-admin/emergency" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        View Emergency Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280;">
      <p style="margin: 0;">Timeframe: ${data.timeframe}</p>
      <p style="margin: 4px 0 0 0;">This is an automated alert from AlessaCloud Monitoring</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: process.env.ADMIN_ALERT_EMAIL || 'ernesto@alessacloud.com',
    subject: `[ALERT] Checkout Failures Detected - ${data.tenantName} (${data.failureCount} failed, ${data.successRate.toFixed(1)}% success)`,
    html,
  });
}

// Generate tenant owner incident report email
export function generateTenantIncidentEmail(data: {
  tenantName: string;
  ownerName: string;
  incidentDate: string;
  affectedCustomers: Array<{
    name: string;
    email: string | null;
    phone: string | null;
    attempts: number;
    totalLost: number;
    lastAttempt: string;
  }>;
  rootCause: string;
  resolution: string;
  preventionSteps: string[];
}): { subject: string; html: string } {
  const customerRows = data.affectedCustomers
    .map(c => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.email || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.phone || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.attempts}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #dc2626;">$${c.totalLost.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">${c.lastAttempt}</td>
      </tr>
    `)
    .join('');

  const totalLost = data.affectedCustomers.reduce((sum, c) => sum + c.totalLost, 0);
  const preventionList = data.preventionSteps.map(s => `<li style="margin-bottom: 8px;">${s}</li>`).join('');

  const subject = `[${data.tenantName}] Technical Incident Report - Online Ordering Issue Resolved`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Technical Incident Report</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${data.tenantName}</p>
    </div>

    <!-- Greeting -->
    <div style="padding: 24px 24px 0 24px;">
      <p style="margin: 0; color: #374151;">Dear ${data.ownerName},</p>
      <p style="margin: 16px 0 0 0; color: #374151; line-height: 1.6;">
        We are writing to inform you about a technical issue that affected your online ordering system.
        The issue has been <strong style="color: #059669;">identified and resolved</strong>. Below is a detailed summary of what happened and the customers who may have been affected.
      </p>
    </div>

    <!-- Incident Summary -->
    <div style="padding: 24px;">
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px;">Incident Summary</h3>
        <table style="width: 100%; font-size: 14px; color: #374151;">
          <tr>
            <td style="padding: 4px 0;"><strong>Date:</strong></td>
            <td style="padding: 4px 0;">${data.incidentDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Affected Customers:</strong></td>
            <td style="padding: 4px 0;">${data.affectedCustomers.length}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Potential Lost Revenue:</strong></td>
            <td style="padding: 4px 0; color: #dc2626; font-weight: bold;">$${totalLost.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Root Cause -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">What Happened</h3>
        <p style="margin: 0; color: #374151; line-height: 1.6; background: #f9fafb; padding: 16px; border-radius: 8px;">
          ${data.rootCause}
        </p>
      </div>

      <!-- Resolution -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">Resolution</h3>
        <p style="margin: 0; color: #374151; line-height: 1.6; background: #ecfdf5; padding: 16px; border-radius: 8px; border: 1px solid #a7f3d0;">
          ${data.resolution}
        </p>
      </div>

      <!-- Affected Customers -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">Affected Customers</h3>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
          We recommend reaching out to these customers to apologize and encourage them to try ordering again:
        </p>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Name</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Email</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Phone</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Attempts</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Amount</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Last Try</th>
              </tr>
            </thead>
            <tbody>
              ${customerRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Prevention -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">Prevention Measures</h3>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
          We have implemented the following measures to prevent this from happening again:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
          ${preventionList}
        </ul>
      </div>
    </div>

    <!-- Call to Action -->
    <div style="padding: 0 24px 24px 24px;">
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af;">Recommended Actions</h4>
        <ol style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
          <li>Contact affected customers to apologize and invite them to order again</li>
          <li>Consider offering a small discount code as a goodwill gesture</li>
          <li>Monitor your orders over the next few days to ensure everything is working</li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
        We sincerely apologize for any inconvenience this may have caused. If you have any questions, please don't hesitate to reach out.
      </p>
      <p style="margin: 0; color: #374151; font-size: 14px;">
        Best regards,<br>
        <strong>AlessaCloud Technical Support</strong><br>
        <a href="mailto:support@alessacloud.com" style="color: #2563eb;">support@alessacloud.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export { resend };
