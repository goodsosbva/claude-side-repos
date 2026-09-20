import { expect, test } from '@playwright/test';
import { OWNER_STATE, PNG_1X1, createRecipeViaApi } from './fixtures';

// setup 에서 만들어 둔 계정으로 들어간다 (가입을 반복하면 rate limit 에 걸린다).
test.use({ storageState: OWNER_STATE });

// feature-spec.md F03(작성) + F06(사진) + F05(상세)
test('사진을 붙여 레시피를 올리면 상세에 그대로 보인다', async ({ page }) => {
  const title = `김치찌개 ${Date.now()}`;

  await page.goto('/recipes/new');
  await page.getByLabel('제목').fill(title);
  await page.getByLabel('재료').fill('신김치 1/4포기\n돼지고기 200g\n두부 1/2모');
  await page.getByLabel('조리순서').fill('김치를 볶는다\n물을 붓고 끓인다\n두부를 넣는다');
  await page.getByLabel(/사진/).setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  });
  await page.getByRole('button', { name: '올리기' }).click();

  // 저장 후 상세로 이동한다.
  await expect(page).toHaveURL(/\/recipes\/[a-z0-9]+$/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  // 재료 3줄, 조리순서 3줄이 각각 목록으로 쪼개져 있어야 한다.
  await expect(page.getByRole('listitem').filter({ hasText: '신김치 1/4포기' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: '두부를 넣는다' })).toBeVisible();

  // 업로드한 사진이 /uploads/ 경로로 붙고, 실제로 200 으로 받아져야 한다.
  const img = page.getByRole('img', { name: title });
  await expect(img).toBeVisible();

  const src = await img.getAttribute('src');
  expect(src).toMatch(/^\/uploads\/.+\.png$/);

  const fetched = await page.request.get(src!);
  expect(fetched.status()).toBe(200);
});

// feature-spec.md F04(목록)
test('올린 레시피가 목록에 나타난다', async ({ page, request }) => {
  const { title } = await createRecipeViaApi(request, { title: `목록확인 ${Date.now()}` });

  await page.goto('/');

  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
});

// feature-spec.md F09(검색)
test('제목과 재료로 검색된다', async ({ page, request }) => {
  const stamp = Date.now();
  const target = await createRecipeViaApi(request, {
    title: `감자탕 ${stamp}`,
    ingredients: `등뼈 1kg\n우거지 ${stamp}`,
  });
  await createRecipeViaApi(request, { title: `상관없는 레시피 ${stamp}` });

  // 제목으로
  await page.goto(`/?q=${encodeURIComponent(`감자탕 ${stamp}`)}`);
  await expect(page.getByTestId('recipe-card')).toHaveCount(1);
  await expect(page.getByRole('link', { name: new RegExp(target.title) })).toBeVisible();

  // 재료로 — 검색 폼을 실제로 써서
  await page.goto('/');
  await page.getByRole('searchbox').fill(`우거지 ${stamp}`);
  await page.getByRole('button', { name: '검색' }).click();

  await expect(page.getByTestId('recipe-card')).toHaveCount(1);
  await expect(page.getByRole('link', { name: new RegExp(target.title) })).toBeVisible();

  // 없는 말은 0건
  await page.goto(`/?q=존재하지않는재료${stamp}`);
  await expect(page.getByTestId('recipe-card')).toHaveCount(0);
  await expect(page.getByTestId('result-count')).toContainText('0건');
});

// feature-spec.md F08(내 레시피)
test('내 레시피 화면에 내 글만 모인다', async ({ page, request }) => {
  const { title } = await createRecipeViaApi(request, { title: `내글 ${Date.now()}` });

  await page.goto('/me');

  await expect(page.getByRole('heading', { name: '내 레시피' })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
});

// risk-analysis.md #3 — 이미지가 아닌 파일은 거절
test('이미지가 아닌 파일은 업로드가 거절된다', async ({ request }) => {
  const res = await request.post('/api/upload', {
    multipart: {
      file: {
        name: 'evil.png',
        mimeType: 'image/png',
        buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
      },
    },
  });

  expect(res.status()).toBe(400);
  expect(await res.text()).toContain('일치하지 않습니다');
});
