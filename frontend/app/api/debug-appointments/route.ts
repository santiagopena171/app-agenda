import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log('=== DEBUG APPOINTMENTS API ===');
  console.log('userId received:', userId);
  console.log('This is a server-side log');

  return NextResponse.json({ 
    message: 'Check server console for logs',
    userId 
  });
}
