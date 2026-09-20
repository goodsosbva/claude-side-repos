import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken, TOKEN_COOKIE, tokenCookieOptions } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';

// feature-spec.md F01 — 이메일/비밀번호 회원가입
export async function POST(req: Request) {
  const limit = rateLimit(`signup:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: '요청이 너무 잦습니다. 잠시 후 다시 시도하십시오.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: '이메일 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, password: await hashPassword(password), name },
    select: { id: true, email: true, name: true },
  });

  const res = NextResponse.json(user, { status: 201 });
  res.cookies.set(TOKEN_COOKIE, signToken({ userId: user.id }), tokenCookieOptions);
  return res;
}
