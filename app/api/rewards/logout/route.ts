import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the customer session cookie
    const cookieStore = await cookies();
    cookieStore.delete('customer_session');
    cookieStore.delete('customer_id');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[rewards/logout] Error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
