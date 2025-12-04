import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { calculateOrderTax } from '@/lib/tax/calculate-tax';

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/admin/tax/status
 * 
 * Returns the status of tax provider configuration for the current tenant
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  try {
    const tenant = await requireTenant();
    const integration = tenant.integrations;
    const provider = (integration?.taxProvider ?? 'builtin').toLowerCase();
    const taxConfig = integration?.taxConfig as Record<string, unknown> | null;

    const status: {
      provider: string;
      configured: boolean;
      status: 'working' | 'not_configured' | 'error' | 'unknown';
      message?: string;
      details?: Record<string, unknown>;
    } = {
      provider,
      configured: false,
      status: 'unknown',
    };

    if (provider === 'builtin') {
      const defaultRate = integration?.defaultTaxRate ?? 0.0825;
      status.configured = true;
      status.status = 'working';
      status.message = `Using built-in tax calculation with rate ${(defaultRate * 100).toFixed(2)}%`;
      status.details = {
        rate: defaultRate,
        ratePercent: (defaultRate * 100).toFixed(2) + '%',
      };
    } else if (provider === 'taxjar') {
      const apiKey = (taxConfig?.apiKey as string) || process.env.TAXJAR_API_KEY;
      
      if (!apiKey) {
        status.configured = false;
        status.status = 'not_configured';
        status.message = 'TaxJar API key not configured. Set TAXJAR_API_KEY in environment or configure in tenant settings.';
      } else {
        status.configured = true;
        
        // Test the API key with a simple calculation
        try {
          const testResult = await calculateOrderTax({
            tenant: {
              id: tenant.id,
              slug: tenant.slug,
              country: tenant.country ?? 'US',
              state: tenant.state ?? null,
              city: tenant.city ?? null,
              postalCode: tenant.postalCode ?? '90210', // Test with known zip
              addressLine1: tenant.addressLine1 ?? null,
              addressLine2: tenant.addressLine2 ?? null,
              integrations: {
                taxProvider: 'taxjar',
                taxConfig: taxConfig as any,
                defaultTaxRate: integration?.defaultTaxRate ?? null,
              },
            },
            items: [
              {
                id: 'test-item',
                quantity: 1,
                unitPrice: 10.00,
              },
            ],
            subtotal: 10.00,
            shipping: 0,
            surcharge: 0,
            destination: {
              country: 'US',
              state: 'CA',
              postalCode: '90210',
            },
          });

          if (testResult.provider === 'taxjar') {
            status.status = 'working';
            status.message = 'TaxJar integration is working correctly';
            status.details = {
              testCalculation: {
                amount: testResult.amount,
                rate: testResult.rate,
                provider: testResult.provider,
              },
            };
          } else {
            status.status = 'error';
            status.message = `TaxJar calculation failed, falling back to ${testResult.provider}`;
            status.details = {
              fallbackProvider: testResult.provider,
              warnings: testResult.warnings,
            };
          }
        } catch (error: any) {
          status.status = 'error';
          status.message = `TaxJar API error: ${error.message}`;
          status.details = {
            error: error.message,
          };
        }
      }
    } else if (provider === 'davo') {
      status.configured = false;
      status.status = 'not_configured';
      status.message = 'Davo/Avalara integration is not yet implemented. Using built-in tax calculation as fallback.';
      status.details = {
        note: 'This is a stub implementation. Full Avalara integration coming soon.',
      };
    } else {
      status.configured = false;
      status.status = 'error';
      status.message = `Unknown tax provider: ${provider}`;
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('[tax] Status check failed:', error);
    return NextResponse.json(
      {
        provider: 'unknown',
        configured: false,
        status: 'error',
        message: error.message || 'Failed to check tax provider status',
      },
      { status: 500 }
    );
  }
}

