import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { MAX_BYTES, saveImage, UploadError } from '@/lib/storage';

// feature-spec.md F06 — 이미지 업로드. risk-analysis.md #3 검증은 storage.saveImage()에 있음
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BYTES * 1.1) {
    // 본문을 다 읽기 전에 조기 차단
    return NextResponse.json({ error: '파일이 너무 큽니다.' }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file 필드에 이미지를 담아 보내십시오.' }, { status: 400 });
  }

  try {
    const url = await saveImage(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[upload] 저장 실패', err);
    return NextResponse.json({ error: '이미지 저장에 실패했습니다.' }, { status: 500 });
  }
}
