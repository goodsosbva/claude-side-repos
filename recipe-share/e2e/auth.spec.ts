import { expect, test } from '@playwright/test';
import { PASSWORD, uniqueEmail } from './fixtures';

// 이 파일은 비로그인 상태에서 시작한다.
test.use({ storageState: { cookies: [], origins: [] } });

// feature-spec.md F01 → F02. 가입하고, 나가고, 다시 들어온다.
test('가입 → 로그아웃 → 로그인', async ({ page }) => {
  const email = uniqueEmail('ui');

  await page.goto('/signup');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel(/이름/).fill('UI 사용자');
  await page.getByLabel('비밀번호').fill(PASSWORD);
  await page.getByRole('button', { name: '가입하기' }).click();

  // 가입하면 홈으로 보내고 헤더가 로그인 상태로 바뀐다.
  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('current-user')).toHaveText('UI 사용자');

  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('current-user')).toHaveText('UI 사용자');
});

test('비밀번호가 8자 미만이면 가입이 거절되고 이유가 보인다', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('이메일').fill(uniqueEmail('short'));
  await page.getByLabel('비밀번호').fill('short');
  await page.getByRole('button', { name: '가입하기' }).click();

  await expect(page.getByRole('alert')).toContainText('8자 이상');
  await expect(page).toHaveURL('/signup');
});

// feature-spec.md F10 — 비로그인 차단
test.describe('비로그인 차단', () => {
  test('작성 화면에 들어가면 로그인으로 보낸다', async ({ page }) => {
    await page.goto('/recipes/new');
    await expect(page).toHaveURL('/login');
  });

  test('내 레시피 화면도 로그인으로 보낸다', async ({ page }) => {
    await page.goto('/me');
    await expect(page).toHaveURL('/login');
  });

  test('API 는 401 로 막는다', async ({ request }) => {
    const res = await request.post('/api/recipes', {
      data: { title: 'x', ingredients: 'x', steps: 'x' },
    });
    expect(res.status()).toBe(401);
  });
});
