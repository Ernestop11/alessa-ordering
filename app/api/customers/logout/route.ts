import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

enum Status {
  Success = 200,
}

export async function POST() {
  cookies().delete('customer_session');
  return NextResponse.json({ ok: true }, { status: Status.Success });
}
