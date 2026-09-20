import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { listRecipes, parseLimit, parseOffset } from '@/lib/recipes';

// feature-spec.md F04(목록) + F09(제목/재료 검색)
// 질의 자체는 lib/recipes.ts 에 있다. 같은 목록을 화면(서버 컴포넌트)도 쓰기 때문이다.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const result = await listRecipes({
    q: searchParams.get('q'),
    limit: parseLimit(searchParams.get('limit')),
    offset: parseOffset(searchParams.get('offset')),
  });

  return NextResponse.json(result);
}

// feature-spec.md F03(작성) + F10(비로그인 차단)
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const ingredients = typeof body?.ingredients === 'string' ? body.ingredients.trim() : '';
  const steps = typeof body?.steps === 'string' ? body.steps.trim() : '';
  const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl : null;

  if (!title || !ingredients || !steps) {
    return NextResponse.json({ error: '제목, 재료, 조리순서는 필수입니다.' }, { status: 400 });
  }
  // 업로드 API가 반환한 경로만 허용 — 외부 URL 주입 차단
  if (imageUrl && !imageUrl.startsWith('/uploads/')) {
    return NextResponse.json({ error: '이미지 경로가 올바르지 않습니다.' }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: { title, ingredients, steps, imageUrl, authorId: userId },
  });

  return NextResponse.json(recipe, { status: 201 });
}
