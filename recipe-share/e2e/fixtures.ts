import path from 'node:path';
import type { APIRequestContext } from '@playwright/test';

export const AUTH_DIR = path.join(__dirname, '.auth');
export const OWNER_STATE = path.join(AUTH_DIR, 'owner.json');
export const OTHER_STATE = path.join(AUTH_DIR, 'other.json');

export const PASSWORD = 'e2e-password-1234';

// 매 실행마다 새 계정을 쓴다. docker 로 띄운 대상처럼 DB 가 초기화되지 않는 환경에서도
// 이전 실행과 충돌하지 않게 하기 위함이다.
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

// storage.ts 의 매직넘버 검사를 통과해야 하므로 진짜 PNG 여야 한다 (1x1, 69 bytes).
// 파일로 두지 않고 버퍼로 들고 있는 이유는 저장소에 바이너리를 넣지 않기 위함이다.
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQD3A0FDAAAAAElFTkSuQmCC',
  'base64',
);

export async function createRecipeViaApi(
  request: APIRequestContext,
  data: { title: string; ingredients?: string; steps?: string },
): Promise<{ id: string; title: string }> {
  const res = await request.post('/api/recipes', {
    data: {
      ingredients: '재료 A\n재료 B',
      steps: '1단계\n2단계',
      ...data,
    },
  });

  if (res.status() !== 201) {
    throw new Error(`레시피 생성 실패: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as { id: string; title: string };
}
