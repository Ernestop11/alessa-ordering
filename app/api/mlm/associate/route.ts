import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Generate unique referral code
function generateReferralCode(name: string, email: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6);
  const emailPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}${emailPart}${random}`.toUpperCase();
}

// Calculate downline level
async function calculateLevel(sponsorId: string | null): Promise<number> {
  if (!sponsorId) return 1;
  const sponsor = await prisma.associate.findUnique({
    where: { id: sponsorId },
    select: { level: true },
  });
  return (sponsor?.level || 0) + 1;
}

// GET - Get current associate or list all (super admin only)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('id');
  const email = searchParams.get('email');

  // Super admin can view all associates
  if (role === 'super_admin') {
    if (associateId) {
      const associate = await prisma.associate.findUnique({
        where: { id: associateId },
        include: {
          sponsor: {
            select: { id: true, name: true, email: true, referralCode: true },
          },
          _count: {
            select: { downline: true, referrals: true, commissions: true },
          },
        },
      });
      if (!associate) {
        return NextResponse.json({ error: 'Associate not found' }, { status: 404 });
      }
      const { password, ...associateWithoutPassword } = associate;
      return NextResponse.json(associateWithoutPassword);
    }

    const associates = await prisma.associate.findMany({
      include: {
        sponsor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { downline: true, referrals: true, commissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const associatesWithoutPasswords = associates.map(({ password, ...rest }) => rest);
    return NextResponse.json(associatesWithoutPasswords);
  }

  // Regular users need to authenticate as associate (TODO: implement associate auth)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// POST - Create new associate (registration)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, referralCode: sponsorReferralCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.associate.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Find sponsor if referral code provided
    let sponsorId: string | null = null;
    if (sponsorReferralCode) {
      const sponsor = await prisma.associate.findUnique({
        where: { referralCode: sponsorReferralCode },
      });
      if (sponsor) {
        sponsorId = sponsor.id;
      }
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(name, email);
    let attempts = 0;
    while (await prisma.associate.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode(name, email) + Math.random().toString(36).substring(2, 4).toUpperCase();
      attempts++;
      if (attempts > 10) {
        return NextResponse.json(
          { error: 'Failed to generate unique referral code' },
          { status: 500 }
        );
      }
    }

    // Calculate level
    const level = await calculateLevel(sponsorId);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create associate
    const associate = await prisma.associate.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        referralCode,
        sponsorId,
        level,
        status: 'ACTIVE',
      },
      include: {
        sponsor: {
          select: { id: true, name: true, email: true, referralCode: true },
        },
      },
    });

    const { password: _, ...associateWithoutPassword } = associate;

    return NextResponse.json(
      {
        id: associateWithoutPassword.id,
        name: associateWithoutPassword.name,
        email: associateWithoutPassword.email,
        referralCode: associateWithoutPassword.referralCode,
        sponsor: associateWithoutPassword.sponsor,
        level: associateWithoutPassword.level,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating associate:', error);
    return NextResponse.json(
      { error: 'Failed to create associate', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update associate
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const associate = await prisma.associate.update({
      where: { id },
      data: updateData,
    });

    const { password, ...associateWithoutPassword } = associate;
    return NextResponse.json(associateWithoutPassword);
  } catch (error: any) {
    console.error('Error updating associate:', error);
    return NextResponse.json(
      { error: 'Failed to update associate', details: error.message },
      { status: 500 }
    );
  }
}

