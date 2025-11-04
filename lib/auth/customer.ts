import { cookies } from 'next/headers';
import prisma from '../prisma';

export async function getCustomerFromCookie(tenantId: string) {
  const token = cookies().get('customer_session')?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findFirst({
    where: {
      tenantId,
      token,
      expiresAt: { gt: new Date() },
    },
    include: {
      customer: true,
    },
  });

  return session?.customer ?? null;
}
