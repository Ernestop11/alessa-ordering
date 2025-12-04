import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

// Recursive function to build downline tree
async function buildDownlineTree(id: string, depth: number = 0, maxDepth: number = 5): Promise<any> {
  if (depth >= maxDepth) return null;

  const associate = await prisma.associate.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          downline: true,
          referrals: true,
          commissions: true,
        },
      },
    },
  });

  if (!associate) return null;

  const downline = await prisma.associate.findMany({
    where: { sponsorId: id },
    include: {
      _count: {
        select: {
          downline: true,
          referrals: true,
          commissions: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const { password, ...associateWithoutPassword } = associate;

  const children = await Promise.all(
    downline.map((child) => buildDownlineTree(child.id, depth + 1, maxDepth))
  );

  return {
    ...associateWithoutPassword,
    children: children.filter(Boolean),
    downlineCount: associate._count.downline,
    referralsCount: associate._count.referrals,
    commissionsCount: associate._count.commissions,
  };
}

// GET - Get downline tree for an associate
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  // For testing, allow viewing downline without auth
  // TODO: Regular associates can only view their own downline
  // if (role !== 'super_admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const tree = await buildDownlineTree(associateId);

    if (!tree) {
      return NextResponse.json({ error: 'Associate not found' }, { status: 404 });
    }

    return NextResponse.json(tree);
  } catch (error: any) {
    console.error('Error fetching downline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch downline', details: error.message },
      { status: 500 }
    );
  }
}

