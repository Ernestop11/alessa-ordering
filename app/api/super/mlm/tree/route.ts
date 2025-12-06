import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  try {
    const associates = await prisma.associate.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        upline: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        downline: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Build tree structure
    const buildTree = (associateId: string | null): any[] => {
      const children = associates.filter((a) => a.uplineId === associateId);
      return children.map((associate) => ({
        name: associate.user?.name || 'Unknown',
        attributes: {
          id: associate.id,
          rank: associate.rank,
          totalRecruits: associate.totalRecruits,
          email: associate.user?.email || '',
        },
        children: buildTree(associate.id),
      }));
    };

    // Find root (no upline)
    const rootAssociates = associates.filter((a) => !a.uplineId);
    const tree = rootAssociates.map((root) => ({
      name: root.user?.name || 'Root',
      attributes: {
        id: root.id,
        rank: root.rank,
        totalRecruits: root.totalRecruits,
        email: root.user?.email || '',
      },
      children: buildTree(root.id),
    }));

    // Calculate rank average (convert enum to number if needed)
    const rankValues = associates.map((a) => {
      // Map rank enum to numeric value for average calculation
      const rankMap: Record<string, number> = {
        REP: 1,
        SENIOR_REP: 2,
        SUPERVISOR: 3,
        MANAGER: 4,
        SENIOR_MANAGER: 5,
        DIRECTOR: 6,
        SENIOR_DIRECTOR: 7,
        VP: 8,
        SVP: 9,
      };
      return rankMap[a.rank] || 0;
    });

    return NextResponse.json({
      tree: tree.length > 0 ? tree[0] : null,
      stats: {
        totalAssociates: associates.length,
        totalRecruits: associates.reduce((sum, a) => sum + a.totalRecruits, 0),
        averageRank: rankValues.length > 0 ? rankValues.reduce((sum, r) => sum + r, 0) / rankValues.length : 0,
      },
    });
  } catch (error: any) {
    console.error('[MLM Tree API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

