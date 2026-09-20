import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { getCurrentUser } from '@/lib/session';

// 서버 컴포넌트다. 쿠키를 직접 읽으므로 /api/auth/me 왕복이 필요 없다.
// 로그인/로그아웃 뒤에는 클라이언트에서 router.refresh() 로 이 헤더를 다시 그린다.
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          레시피 공유
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/recipes/new" className="hover:underline">
                레시피 쓰기
              </Link>
              <Link href="/me" className="hover:underline">
                내 레시피
              </Link>
              <span className="text-neutral-500" data-testid="current-user">
                {user.name ?? user.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                로그인
              </Link>
              <Link href="/signup" className="hover:underline">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
