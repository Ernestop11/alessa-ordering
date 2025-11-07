import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function json(data: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();

  return json({
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
      heroImageUrl: tenant.heroImageUrl,
      heroTitle: tenant.heroTitle,
      heroSubtitle: tenant.heroSubtitle,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      addressLine1: tenant.addressLine1,
      addressLine2: tenant.addressLine2,
      city: tenant.city,
      state: tenant.state,
      postalCode: tenant.postalCode,
    },
    settings: tenant.settings
      ? {
          tagline: tenant.settings.tagline,
          about: tenant.settings.about,
          socialInstagram: tenant.settings.socialInstagram,
          socialFacebook: tenant.settings.socialFacebook,
          socialTikTok: tenant.settings.socialTikTok,
          socialYouTube: tenant.settings.socialYouTube,
          deliveryRadiusMi: tenant.settings.deliveryRadiusMi,
          minimumOrderValue: tenant.settings.minimumOrderValue,
          currency: tenant.settings.currency,
          timeZone: tenant.settings.timeZone,
          membershipProgram: tenant.settings.membershipProgram,
          upsellBundles: tenant.settings.upsellBundles,
          accessibilityDefaults: tenant.settings.accessibilityDefaults,
          isOpen: tenant.settings.isOpen ?? true,
          branding: tenant.settings.branding ?? null,
        }
      : null,
    integrations: tenant.integrations
      ? {
          platformPercentFee: tenant.integrations.platformPercentFee,
          platformFlatFee: tenant.integrations.platformFlatFee,
          defaultTaxRate: tenant.integrations.defaultTaxRate,
          deliveryBaseFee: tenant.integrations.deliveryBaseFee,
          stripeAccountId: tenant.integrations.stripeAccountId,
          autoPrintOrders: tenant.integrations.autoPrintOrders ?? false,
          fulfillmentNotificationsEnabled: tenant.integrations.fulfillmentNotificationsEnabled ?? true,
          cloverMerchantId: tenant.integrations.cloverMerchantId ?? null,
          cloverApiKey: tenant.integrations.cloverApiKey ?? null,
          printerType: tenant.integrations.printerType ?? 'bluetooth',
          printerEndpoint: tenant.integrations.printerEndpoint ?? null,
          taxProvider: tenant.integrations.taxProvider ?? 'builtin',
          taxConfig: tenant.integrations.taxConfig ?? null,
        }
      : null,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const body = await req.json();
  const existingBranding =
    tenant.settings?.branding && typeof tenant.settings.branding === 'object'
      ? (tenant.settings.branding as Record<string, unknown>)
      : {};

  const tenantData: Record<string, any> = {};
  if (body.restaurantName !== undefined) tenantData.name = String(body.restaurantName);
  if (body.heroTitle !== undefined) tenantData.heroTitle = body.heroTitle || null;
  if (body.heroSubtitle !== undefined) tenantData.heroSubtitle = body.heroSubtitle || null;
  if (body.primaryColor !== undefined) tenantData.primaryColor = body.primaryColor || '#38c4ff';
  if (body.secondaryColor !== undefined) tenantData.secondaryColor = body.secondaryColor || '#071836';
  if (body.contactEmail !== undefined) tenantData.contactEmail = body.contactEmail || null;
  if (body.contactPhone !== undefined) tenantData.contactPhone = body.contactPhone || null;
  if (body.addressLine1 !== undefined) tenantData.addressLine1 = body.addressLine1 || null;
  if (body.addressLine2 !== undefined) tenantData.addressLine2 = body.addressLine2 || null;
  if (body.city !== undefined) tenantData.city = body.city || null;
  if (body.state !== undefined) tenantData.state = body.state || null;
  if (body.postalCode !== undefined) tenantData.postalCode = body.postalCode || null;
  if (body.logoUrl !== undefined) tenantData.logoUrl = body.logoUrl || null;
  if (body.heroImageUrl !== undefined) tenantData.heroImageUrl = body.heroImageUrl || null;

  const settingsData: Record<string, any> = {};
  if (body.tagline !== undefined) settingsData.tagline = body.tagline || null;
  if (body.about !== undefined) settingsData.about = body.about || null;
  if (body.socialInstagram !== undefined) settingsData.socialInstagram = body.socialInstagram || null;
  if (body.socialFacebook !== undefined) settingsData.socialFacebook = body.socialFacebook || null;
  if (body.socialTikTok !== undefined) settingsData.socialTikTok = body.socialTikTok || null;
  if (body.socialYouTube !== undefined) settingsData.socialYouTube = body.socialYouTube || null;
  if (body.currency !== undefined) settingsData.currency = body.currency || 'USD';
  if (body.timeZone !== undefined) settingsData.timeZone = body.timeZone || 'America/Los_Angeles';

  if (body.deliveryRadiusMi !== undefined) {
    const radius = Number(body.deliveryRadiusMi);
    settingsData.deliveryRadiusMi = Number.isFinite(radius) ? radius : null;
  }

  if (body.minimumOrderValue !== undefined) {
    const minOrder = Number(body.minimumOrderValue);
    settingsData.minimumOrderValue = Number.isFinite(minOrder) ? minOrder : null;
  }

  if (body.isOpen !== undefined) {
    settingsData.isOpen = Boolean(body.isOpen);
  }

  if (body.membershipProgram !== undefined) {
    settingsData.membershipProgram = body.membershipProgram || null;
  }

  if (body.upsellBundles !== undefined) {
    settingsData.upsellBundles = Array.isArray(body.upsellBundles) ? body.upsellBundles : [];
  }

  if (body.accessibilityDefaults !== undefined) {
    settingsData.accessibilityDefaults = body.accessibilityDefaults || null;
  }

  if (body.branding !== undefined) {
    if (body.branding === null) {
      settingsData.branding = null;
    } else if (typeof body.branding === 'object') {
      const brandingPayload = body.branding as Record<string, unknown>;
      const nextBranding = { ...existingBranding };
      if (brandingPayload.heroImages !== undefined) {
        nextBranding.heroImages = Array.isArray(brandingPayload.heroImages)
          ? brandingPayload.heroImages.filter((url) => typeof url === 'string' && url.length > 0)
          : [];
      }
      settingsData.branding = nextBranding;
    }
  }

  const integrationsData: Record<string, any> = {};
  if (body.platformPercentFee !== undefined) {
    const value = Number(body.platformPercentFee);
    integrationsData.platformPercentFee = Number.isFinite(value) ? value : null;
  }
  if (body.platformFlatFee !== undefined) {
    const value = Number(body.platformFlatFee);
    integrationsData.platformFlatFee = Number.isFinite(value) ? value : null;
  }
  if (body.defaultTaxRate !== undefined) {
    const value = Number(body.defaultTaxRate);
    integrationsData.defaultTaxRate = Number.isFinite(value) ? value : null;
  }
  if (body.deliveryBaseFee !== undefined) {
    const value = Number(body.deliveryBaseFee);
    integrationsData.deliveryBaseFee = Number.isFinite(value) ? value : null;
  }
  if (body.stripeAccountId !== undefined) {
    integrationsData.stripeAccountId = body.stripeAccountId || null;
  }
  if (body.autoPrintOrders !== undefined) {
    integrationsData.autoPrintOrders = Boolean(body.autoPrintOrders);
  }
  if (body.fulfillmentNotificationsEnabled !== undefined) {
    integrationsData.fulfillmentNotificationsEnabled = Boolean(body.fulfillmentNotificationsEnabled);
  }
  if (body.cloverMerchantId !== undefined) {
    integrationsData.cloverMerchantId = body.cloverMerchantId || null;
  }
  if (body.cloverApiKey !== undefined) {
    integrationsData.cloverApiKey = body.cloverApiKey || null;
  }
  if (body.printerType !== undefined) {
    integrationsData.printerType = body.printerType || 'bluetooth';
  }
  if (body.printerEndpoint !== undefined) {
    integrationsData.printerEndpoint = body.printerEndpoint || null;
  }
  if (body.taxProvider !== undefined) {
    integrationsData.taxProvider = body.taxProvider || 'builtin';
  }
  if (body.taxConfig !== undefined) {
    if (!body.taxConfig) {
      integrationsData.taxConfig = null;
    } else if (typeof body.taxConfig === 'string') {
      try {
        integrationsData.taxConfig = JSON.parse(body.taxConfig);
      } catch {
        integrationsData.taxConfig = null;
      }
    } else if (typeof body.taxConfig === 'object') {
      integrationsData.taxConfig = body.taxConfig;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(tenantData).length > 0) {
      await tx.tenant.update({
        where: { id: tenant.id },
        data: tenantData,
      });
    }

    if (Object.keys(settingsData).length > 0) {
      await tx.tenantSettings.upsert({
        where: { tenantId: tenant.id },
        update: settingsData,
        create: {
          tenantId: tenant.id,
          ...settingsData,
        },
      });
    }

    if (Object.keys(integrationsData).length > 0) {
      await tx.tenantIntegration.upsert({
        where: { tenantId: tenant.id },
        update: integrationsData,
        create: {
          tenantId: tenant.id,
          ...integrationsData,
        },
      });
    }
  });

  revalidatePath('/');
  revalidatePath('/order');

  const updatedTenant = await requireTenant();

  return json({
    tenant: {
      name: updatedTenant.name,
      slug: updatedTenant.slug,
      logoUrl: updatedTenant.logoUrl,
      heroImageUrl: updatedTenant.heroImageUrl,
      heroTitle: updatedTenant.heroTitle,
      heroSubtitle: updatedTenant.heroSubtitle,
      primaryColor: updatedTenant.primaryColor,
      secondaryColor: updatedTenant.secondaryColor,
      contactEmail: updatedTenant.contactEmail,
      contactPhone: updatedTenant.contactPhone,
      addressLine1: updatedTenant.addressLine1,
      addressLine2: updatedTenant.addressLine2,
      city: updatedTenant.city,
      state: updatedTenant.state,
      postalCode: updatedTenant.postalCode,
    },
    settings: updatedTenant.settings
      ? {
          tagline: updatedTenant.settings.tagline,
          about: updatedTenant.settings.about,
          socialInstagram: updatedTenant.settings.socialInstagram,
          socialFacebook: updatedTenant.settings.socialFacebook,
          socialTikTok: updatedTenant.settings.socialTikTok,
          socialYouTube: updatedTenant.settings.socialYouTube,
          deliveryRadiusMi: updatedTenant.settings.deliveryRadiusMi,
          minimumOrderValue: updatedTenant.settings.minimumOrderValue,
          currency: updatedTenant.settings.currency,
          timeZone: updatedTenant.settings.timeZone,
          membershipProgram: updatedTenant.settings.membershipProgram,
          upsellBundles: updatedTenant.settings.upsellBundles,
          accessibilityDefaults: updatedTenant.settings.accessibilityDefaults,
          branding: updatedTenant.settings.branding ?? null,
        }
      : null,
    integrations: updatedTenant.integrations
      ? {
          platformPercentFee: updatedTenant.integrations.platformPercentFee,
          platformFlatFee: updatedTenant.integrations.platformFlatFee,
          defaultTaxRate: updatedTenant.integrations.defaultTaxRate,
          deliveryBaseFee: updatedTenant.integrations.deliveryBaseFee,
          stripeAccountId: updatedTenant.integrations.stripeAccountId,
          autoPrintOrders: updatedTenant.integrations.autoPrintOrders ?? false,
          fulfillmentNotificationsEnabled: updatedTenant.integrations.fulfillmentNotificationsEnabled ?? true,
          cloverMerchantId: updatedTenant.integrations.cloverMerchantId ?? null,
          cloverApiKey: updatedTenant.integrations.cloverApiKey ?? null,
          printerType: updatedTenant.integrations.printerType ?? 'bluetooth',
          printerEndpoint: updatedTenant.integrations.printerEndpoint ?? null,
          taxProvider: updatedTenant.integrations.taxProvider ?? 'builtin',
          taxConfig: updatedTenant.integrations.taxConfig ?? null,
        }
      : null,
  });
}
