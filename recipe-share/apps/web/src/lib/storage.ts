import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

// architecture.md 확장 포인트: saveImage()의 시그니처(Promise<string> URL 반환)만 유지하면
// 내부를 S3 SDK 호출로 교체해도 호출부(API 라우트)는 무수정.

// risk-analysis.md #3: MIME 화이트리스트 + 용량 상한은 F06의 필수 요구사항
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

// 확장자/헤더 위장 방지 — 실제 바이트의 매직 넘버를 확인한다
function sniff(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export async function saveImage(file: File): Promise<string> {
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
    throw new UploadError(`허용되지 않는 형식입니다. (${ALLOWED_MIME.join(', ')}만 가능)`);
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError(`파일이 너무 큽니다. 최대 ${MAX_BYTES / 1024 / 1024}MB까지 허용됩니다.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const actual = sniff(buffer);
  if (!actual || actual !== file.type) {
    // SVG 업로드를 통한 XSS, 확장자 위장 파일 차단
    throw new UploadError('파일 내용이 선언된 이미지 형식과 일치하지 않습니다.');
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}${EXTENSION[file.type]}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}
