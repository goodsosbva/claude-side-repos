import { expect, test } from '@playwright/test';
import { OTHER_STATE, OWNER_STATE, createRecipeViaApi } from './fixtures';

// feature-spec.md F07(수정·삭제) + risk-analysis.md #4(IDOR)

test.describe('작성자 본인', () => {
  test.use({ storageState: OWNER_STATE });

  test('자기 레시피를 수정한다', async ({ page, request }) => {
    const { id, title } = await createRecipeViaApi(request, { title: `수정전 ${Date.now()}` });
    const newTitle = `${title} (수정됨)`;

    await page.goto(`/recipes/${id}`);
    await page.getByRole('link', { name: '수정' }).click();

    await expect(page).toHaveURL(`/recipes/${id}/edit`);
    await page.getByLabel('제목').fill(newTitle);
    await page.getByRole('button', { name: '수정하기' }).click();

    await expect(page).toHaveURL(`/recipes/${id}`);
    await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();
  });

  test('자기 레시피를 삭제한다', async ({ page, request }) => {
    const { id, title } = await createRecipeViaApi(request, { title: `삭제대상 ${Date.now()}` });

    await page.goto(`/recipes/${id}`);
    // 한 번에 지워지지 않는다 — 확인 단계가 있다.
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await page.getByRole('button', { name: '정말 삭제' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveCount(0);

    const res = await page.request.get(`/api/recipes/${id}`);
    expect(res.status()).toBe(404);
  });
});

test.describe('남의 레시피', () => {
  test('수정 화면에 들어가면 상세로 돌려보낸다', async ({ browser }) => {
    // 주인 계정으로 글을 하나 만들고
    const ownerContext = await browser.newContext({ storageState: OWNER_STATE });
    const { id } = await createRecipeViaApi(ownerContext.request, {
      title: `남의글 ${Date.now()}`,
    });
    await ownerContext.close();

    // 다른 계정으로 접근한다
    const otherContext = await browser.newContext({ storageState: OTHER_STATE });
    const page = await otherContext.newPage();

    await page.goto(`/recipes/${id}`);
    // 수정·삭제 버튼 자체가 보이지 않아야 한다
    await expect(page.getByRole('link', { name: '수정' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toHaveCount(0);

    // URL 을 직접 쳐도 막힌다
    await page.goto(`/recipes/${id}/edit`);
    await expect(page).toHaveURL(`/recipes/${id}`);

    // 화면을 우회해 API 를 직접 때려도 403
    const put = await otherContext.request.put(`/api/recipes/${id}`, {
      data: { title: '탈취 시도' },
    });
    expect(put.status()).toBe(403);

    const del = await otherContext.request.delete(`/api/recipes/${id}`);
    expect(del.status()).toBe(403);

    await otherContext.close();
  });
});
