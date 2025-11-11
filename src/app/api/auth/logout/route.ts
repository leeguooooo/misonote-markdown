import { NextResponse } from 'next/server';
import { ADMIN_TOKEN_COOKIE, adminCookieOptions } from '@/lib/server/auth-cookies';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_TOKEN_COOKIE, '', {
    ...adminCookieOptions,
    maxAge: 0,
  });
  return response;
}
