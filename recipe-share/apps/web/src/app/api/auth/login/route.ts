import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken, TOKEN_COOKIE, tokenCookieOptions, verifyPassword } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';

// feature-spec.md F02 — 로그인, JWT를 httpOnly 쿠키로 발급
export async function POST(req: Request) {
  // risk-analysis.md #6: 로그인은 보안 경계이므로 rate limit 생략 금지
  const limit = rateLimit(`login:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하십시오.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력하십시오.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // 계정 존재 여부가 드러나지 않도록 실패 메시지를 통일
  const ok = user ? await verifyPassword(password, user.password) : false;
  if (!user || !ok) {
    return NextResponse.json(
      { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ id: user.id, email: user.email, name: user.name });
  res.cookies.set(TOKEN_COOKIE, signToken({ userId: user.id }), tokenCookieOptions);
  return res;
}
