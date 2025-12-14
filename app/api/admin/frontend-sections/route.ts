import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

/**
 * GET - Fetch all frontend sections for a tenant
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    const sections = await prisma.frontendSection.findMany({
      where: { tenantId: tenant.id },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('[Frontend Sections GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch frontend sections' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new frontend section
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Get max position to append new section
    const maxPosition = await prisma.frontendSection.aggregate({
      where: { tenantId: tenant.id },
      _max: { position: true },
    });

    const section = await prisma.frontendSection.create({
      data: {
        tenantId: tenant.id,
        name: body.name,
        type: body.type,
        position: (maxPosition._max.position ?? -1) + 1,
        enabled: body.enabled !== undefined ? body.enabled : true,
        content: body.content || {},
        insertAfter: body.insertAfter !== undefined ? body.insertAfter : null,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('[Frontend Sections POST Error]', error);
    return NextResponse.json(
      { error: 'Failed to create frontend section' },
      { status: 500 }
    );
  }
}
