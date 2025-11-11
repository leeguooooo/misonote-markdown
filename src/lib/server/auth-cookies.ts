export const ADMIN_TOKEN_COOKIE = 'admin_token';

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24h
  path: '/',
};
