import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';

// 클라이언트 컴포넌트가 로그인 상태를 확인할 때 쓴다.
// 서버 컴포넌트는 getCurrentUser() 를 직접 부르면 되므로 이 라우트를 거칠 필요가 없다.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  return NextResponse.json(user);
}
