import { handlers } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Wrap handlers to gracefully handle missing auth configuration
async function wrappedGET(req: NextRequest) {
  try {
    // Check if this is a session request and auth isn't fully configured
    if (req.nextUrl.pathname.endsWith('/session')) {
      // If AUTH_SECRET isn't set, just return empty session
      if (!process.env.AUTH_SECRET) {
        return NextResponse.json({ user: null, expires: new Date(0).toISOString() });
      }
    }
    return await handlers.GET(req);
  } catch (error) {
    console.error('Auth GET error:', error);
    // Return empty session on error for session endpoint
    if (req.nextUrl.pathname.endsWith('/session')) {
      return NextResponse.json({ user: null, expires: new Date(0).toISOString() });
    }
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }
}

async function wrappedPOST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (error) {
    console.error('Auth POST error:', error);
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }
}

export { wrappedGET as GET, wrappedPOST as POST };
