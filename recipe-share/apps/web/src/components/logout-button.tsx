'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    // replace 가 아니라 push 하지 않는 이유: 현재 화면이 보호된 페이지일 수 있다.
    router.replace('/');
    router.refresh();
  }

  return (
    <Button variant="ghost" className="h-8 px-2" onClick={logout} disabled={pending}>
      로그아웃
    </Button>
  );
}
