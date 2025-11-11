import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_TOKEN_COOKIE } from './src/lib/server/auth-cookies';

const ADMIN_PATH = '/admin';

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith(ADMIN_PATH)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
