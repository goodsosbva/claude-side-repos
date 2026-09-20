'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'login' | 'signup';

const COPY = {
  login: {
    title: '로그인',
    submit: '로그인',
    endpoint: '/api/auth/login',
    altText: '계정이 없으십니까?',
    altHref: '/signup',
    altLabel: '회원가입',
  },
  signup: {
    title: '회원가입',
    submit: '가입하기',
    endpoint: '/api/auth/signup',
    altText: '이미 계정이 있으십니까?',
    altHref: '/login',
    altLabel: '로그인',
  },
} as const;

// feature-spec.md F01·F02. 두 화면의 차이가 필드 하나와 엔드포인트뿐이라 한 컴포넌트로 둔다.
export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    };
    if (mode === 'signup') payload.name = String(form.get('name') ?? '');

    const res = await fetch(copy.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? '요청을 처리하지 못했습니다.');
      setPending(false);
      return;
    }

    // 쿠키가 바뀌었으니 서버 컴포넌트(헤더 포함)를 다시 그려야 한다.
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">{copy.title}</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              이름 <span className="font-normal text-neutral-400">(선택)</span>
            </label>
            <Input id="name" name="name" type="text" autoComplete="name" />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />
          {mode === 'signup' && <p className="text-xs text-neutral-500">8자 이상이어야 합니다.</p>}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? '처리 중…' : copy.submit}
        </Button>
      </form>

      <p className="mt-4 text-sm text-neutral-500">
        {copy.altText}{' '}
        <Link href={copy.altHref} className="underline">
          {copy.altLabel}
        </Link>
      </p>
    </div>
  );
}
