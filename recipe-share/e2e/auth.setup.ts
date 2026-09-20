import { mkdirSync } from 'node:fs';
import { expect, test as setup } from '@playwright/test';
import { AUTH_DIR, OTHER_STATE, OWNER_STATE, PASSWORD, uniqueEmail } from './fixtures';

// 로그인 상태를 두 개 만들어 파일로 저장한다.
//  - owner: 레시피를 쓰고 고치는 주인공
//  - other: 남의 글을 건드리려다 막히는 역할 (risk-analysis.md #4)
//
// 여기서 API 로 가입하는 이유는 속도가 아니라 rate limit 때문이다.
// 화면으로 가입하는 경로(F01)는 auth.spec.ts 가 따로 검증한다.

setup('로그인 상태 준비', async ({ playwright, baseURL }) => {
  mkdirSync(AUTH_DIR, { recursive: true });

  for (const [prefix, statePath] of [
    ['owner', OWNER_STATE],
    ['other', OTHER_STATE],
  ] as const) {
    const context = await playwright.request.newContext({ baseURL });

    const res = await context.post('/api/auth/signup', {
      data: { email: uniqueEmail(prefix), password: PASSWORD, name: prefix },
    });
    expect(res.status(), `${prefix} 가입 실패: ${await res.text()}`).toBe(201);

    await context.storageState({ path: statePath });
    await context.dispose();
  }
});
