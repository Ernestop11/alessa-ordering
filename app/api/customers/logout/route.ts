import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

enum Status {
  Success = 200,
}

export async function POST() {
  const jar = cookies();
  const token = jar.get('customer_session')?.value;

  if (token) {
    await prisma.customerSession.deleteMany({
      where: { token },
    });
  }

  jar.delete('customer_session');
  return NextResponse.json({ ok: true }, { status: Status.Success });
}
