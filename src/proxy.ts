import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout'];

function isPublicPath(pathname: string): boolean {
  // Remove locale prefix for checking
  const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';
  return publicPaths.some((p) => pathWithoutLocale.startsWith(p));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth and i18n for static assets, Next.js internals, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') // static files like favicon.ico
  ) {
    return NextResponse.next();
  }

  // API routes need auth but NOT i18n rewriting
  if (pathname.startsWith('/api/')) {
    if (!isPublicPath(pathname)) {
      const sessionCookie = request.cookies.get('admin-session');
      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'dev-secret-change-in-production'
        );
        await jwtVerify(sessionCookie.value, secret);
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // Check authentication for non-public routes
  if (!isPublicPath(pathname)) {
    const sessionCookie = request.cookies.get('admin-session');

    if (!sessionCookie?.value) {
      // Determine locale from pathname or default
      const localeMatch = pathname.match(/^\/(es|en)/);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verify JWT token
    try {
      const { jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'dev-secret-change-in-production'
      );
      await jwtVerify(sessionCookie.value, secret);
    } catch {
      const localeMatch = pathname.match(/^\/(es|en)/);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin-session');
      return response;
    }
  }

  // Handle i18n routing
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except Next.js internals and static files
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
