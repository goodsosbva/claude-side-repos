'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type RecipeFormValues = {
  id?: string;
  title: string;
  ingredients: string;
  steps: string;
  imageUrl: string | null;
};

// 작성(F03)과 수정(F07)이 같은 폼이다. 다른 것은 메서드와 목적지뿐이다.
// 이미지(F06)는 저장 직전에 /api/upload 로 먼저 올리고, 돌려받은 경로만 본문에 싣는다.
// 이래야 레시피 본문과 파일이 한 요청에 섞이지 않는다.
export function RecipeForm({ initial }: { initial?: RecipeFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function uploadImage(file: File): Promise<string | null> {
    const body = new FormData();
    body.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? '이미지 업로드에 실패했습니다.');
    }

    const payload = (await res.json()) as { url: string };
    return payload.url;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const file = form.get('image');

    try {
      let nextImageUrl = imageUrl;
      if (file instanceof File && file.size > 0) {
        nextImageUrl = await uploadImage(file);
        setImageUrl(nextImageUrl);
      }

      const payload = {
        title: String(form.get('title') ?? '').trim(),
        ingredients: String(form.get('ingredients') ?? '').trim(),
        steps: String(form.get('steps') ?? '').trim(),
        imageUrl: nextImageUrl,
      };

      const res = await fetch(isEdit ? `/api/recipes/${initial?.id}` : '/api/recipes', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? '저장하지 못했습니다.');
      }

      const saved = (await res.json()) as { id: string };
      router.replace(`/recipes/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했습니다.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          제목
        </label>
        <Input id="title" name="title" defaultValue={initial?.title} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ingredients" className="text-sm font-medium">
          재료
        </label>
        <Textarea
          id="ingredients"
          name="ingredients"
          rows={5}
          placeholder="한 줄에 하나씩 적으십시오"
          defaultValue={initial?.ingredients}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="steps" className="text-sm font-medium">
          조리순서
        </label>
        <Textarea
          id="steps"
          name="steps"
          rows={8}
          placeholder="한 줄에 한 단계씩 적으십시오"
          defaultValue={initial?.steps}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="image" className="text-sm font-medium">
          사진 <span className="font-normal text-neutral-400">(선택, 5MB 이하 JPG·PNG·WebP)</span>
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm"
        />
        {imageUrl && (
          <p className="text-xs text-neutral-500" data-testid="current-image">
            현재 사진: {imageUrl}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? '저장 중…' : isEdit ? '수정하기' : '올리기'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          취소
        </Button>
      </div>
    </form>
  );
}
