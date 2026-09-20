import { expect, test } from '@playwright/test';

// 로그인하지 않은 방문자 시점. setup 이 남긴 쿠키를 쓰지 않는다.
test.use({ storageState: { cookies: [], origins: [] } });

test('홈이 서버 오류 없이 렌더링된다', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (e) => pageErrors.push(e));

  const res = await page.goto('/');

  expect(res?.status()).toBe(200);
  // 화면 문구는 바뀔 수 있다. 뼈대만 확인한다.
  await expect(page.getByRole('heading', { name: '레시피', exact: true })).toBeVisible();
  await expect(page.getByRole('search')).toBeVisible();
  expect(pageErrors).toHaveLength(0);
});

test('없는 레시피는 404 다', async ({ page }) => {
  const res = await page.goto('/recipes/does-not-exist');
  expect(res?.status()).toBe(404);
});
