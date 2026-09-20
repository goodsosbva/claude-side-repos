import { NextResponse } from 'next/server';
import { TOKEN_COOKIE, tokenCookieOptions } from '@/lib/auth';

// httpOnly 쿠키는 JS 로 지울 수 없다. 그래서 로그아웃에도 서버 왕복이 필요하다.
export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(TOKEN_COOKIE, '', { ...tokenCookieOptions, maxAge: 0 });
  return res;
}
