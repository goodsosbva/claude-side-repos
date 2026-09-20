'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// confirm() 대신 두 단계 버튼을 쓴다. 브라우저 모달은 e2e 에서 다루기 번거롭고,
// 실수 방지라는 목적은 이것으로 충분히 달성된다.
export function DeleteRecipeButton({ id }: { id: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    setError(null);

    const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? '삭제하지 못했습니다.');
      setPending(false);
      return;
    }

    router.replace('/');
    router.refresh();
  }

  if (!armed) {
    return (
      <Button variant="destructive" onClick={() => setArmed(true)}>
        삭제
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <Button variant="destructive" onClick={remove} disabled={pending}>
        {pending ? '삭제 중…' : '정말 삭제'}
      </Button>
      <Button variant="ghost" onClick={() => setArmed(false)} disabled={pending}>
        취소
      </Button>
      {error && (
        <span role="alert" className="text-sm text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
