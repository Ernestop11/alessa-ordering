import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the domain verification file from public directory
    const filePath = path.join(process.cwd(), 'public', '.well-known', 'apple-developer-merchantid-domain-association');

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf8');

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Apple Pay Domain] Error serving domain verification file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
