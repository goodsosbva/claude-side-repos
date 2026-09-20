import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

// auth.ts 는 DB 를 모르는 채로 둔다 (JWT·해시 전담).
// 화면에서 "지금 누가 로그인했는가"를 알아야 하는 경우는 여기로 온다.

export type SessionUser = { id: string; email: string; name: string | null };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // 토큰은 멀쩡한데 사용자가 삭제된 경우를 걸러내기 위해 실제로 조회한다.
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
}
