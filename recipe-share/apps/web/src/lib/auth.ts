import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const TOKEN_COOKIE = 'token';

// 모듈 로드 시점이 아니라 사용 시점에 검사 — 빌드 단계에서 환경변수가 없어도 빌드는 통과시킴
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 환경변수가 없습니다. .env.local을 확인하십시오.');
  }
  return secret;
}

export type JwtPayload = { userId: string };

// risk-analysis.md #7: revocation 수단이 없으므로 만료시간을 짧게 가져가는 선에서 타협
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '2h';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

// Route Handler에서 로그인 사용자 식별. 비로그인이면 null (feature-spec.md F10 가드의 기반)
// Next 16부터 cookies()는 비동기 전용
export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

export const tokenCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 2,
};
