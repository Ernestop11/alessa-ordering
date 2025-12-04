import { NextResponse } from 'next/server';
import { authenticateAssociate } from '@/lib/mlm/auth';
import { signIn } from 'next-auth/react';

// POST - Associate login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateAssociate(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // For now, return associate data
    // TODO: Integrate with NextAuth or create JWT session
    return NextResponse.json({
      success: true,
      associate: result.associate,
      // In production, you'd set a session cookie or JWT here
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}

