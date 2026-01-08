import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' },
    select: {
      name: true,
      logoUrl: true,
      primaryColor: true,
      customDomain: true,
      emailDomainVerified: true,
    }
  });

  if (!tenant) {
    console.error('Tenant not found');
    return;
  }

  const logoUrl = tenant.logoUrl
    ? (tenant.logoUrl.startsWith('http') ? tenant.logoUrl : `https://lasreinascolusa.com${tenant.logoUrl}`)
    : null;

  const primaryColor = tenant.primaryColor || '#dc2626';
  const tenantName = tenant.name;

  const fromEmail = tenant.emailDomainVerified && tenant.customDomain
    ? `${tenantName} <noreply@${tenant.customDomain}>`
    : 'noreply@alessacloud.com';

  console.log('Sending from:', fromEmail);
  console.log('Logo URL:', logoUrl);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
  <tr>
    <td style="padding:32px 24px;background:${primaryColor};text-align:center;">
      ${logoUrl ? `
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="background:#ffffff;border-radius:50%;width:90px;height:90px;text-align:center;vertical-align:middle;box-shadow:0 2px 10px rgba(0,0,0,0.2);">
              <img src="${logoUrl}" alt="${tenantName}" width="70" height="70" style="display:block;margin:0 auto;max-height:70px;max-width:70px;">
            </td>
          </tr>
        </table>
      ` : `<h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">${tenantName}</h1>`}
    </td>
  </tr>
  <tr>
    <td style="padding:32px 24px;text-align:center;">
      <h2 style="margin:0 0 8px;font-size:22px;color:#000;font-weight:700;">Test Email - Branded Template</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">This is a test of the new branded email for ${tenantName}</p>
      <div style="background:linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);border-radius:12px;padding:24px;margin:0 auto;max-width:280px;border:2px dashed ${primaryColor};">
        <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:8px;color:${primaryColor};">123456</p>
      </div>
      <p style="margin:24px 0 0;color:#999;font-size:13px;">Email branding test successful!</p>
      <p style="margin:8px 0 0;color:#999;font-size:12px;">Sent from: ${fromEmail}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#999;">Powered by AlessaCloud</p>
    </td>
  </tr>
</table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: 'ernesto@mvicorp.net',
      subject: 'Test Email - Las Reinas Branded Template',
      html: html,
    });

    console.log('Email sent:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }

  await prisma.$disconnect();
}

main();
