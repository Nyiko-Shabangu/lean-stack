import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ─── DEV BYPASS ───────────────────────────────────────────────────────────────
// Set to `true` to skip Clerk auth entirely. 
// Uses a plain middleware function to avoid Clerk init crashes when keys are missing.
const DEV_BYPASS = process.env.NODE_ENV !== 'production' && true;

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/api/webhooks/(.*)',
]);

// ─── Middleware ───────────────────────────────────────────────────────────────

const defaultMiddleware = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();
  await auth.protect();
  return NextResponse.next();
});

// If bypass is active, export a plain function that just passes through.
// This prevents Clerk from throwing "Missing Publishable Key" errors at startup.
export default DEV_BYPASS 
  ? () => NextResponse.next() 
  : defaultMiddleware;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

