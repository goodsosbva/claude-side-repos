import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { getRecipe } from '@/lib/recipes';

// Next 16부터 params는 Promise
type Params = { params: Promise<{ id: string }> };

// feature-spec.md F05 — 상세 조회
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    return NextResponse.json({ error: '레시피를 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json(recipe);
}

// feature-spec.md F07 — 수정. risk-analysis.md #4(IDOR) 대응으로 소유권 검증 필수
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!recipe) {
    return NextResponse.json({ error: '레시피를 찾을 수 없습니다.' }, { status: 404 });
  }
  if (recipe.authorId !== userId) {
    return NextResponse.json(
      { error: '본인이 작성한 레시피만 수정할 수 있습니다.' },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const data: Record<string, string | null> = {};
  if (typeof body?.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body?.ingredients === 'string' && body.ingredients.trim()) {
    data.ingredients = body.ingredients.trim();
  }
  if (typeof body?.steps === 'string' && body.steps.trim()) data.steps = body.steps.trim();
  if (typeof body?.imageUrl === 'string' || body?.imageUrl === null) {
    const url = body.imageUrl as string | null;
    if (url && !url.startsWith('/uploads/')) {
      return NextResponse.json({ error: '이미지 경로가 올바르지 않습니다.' }, { status: 400 });
    }
    data.imageUrl = url;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '수정할 내용이 없습니다.' }, { status: 400 });
  }

  const updated = await prisma.recipe.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// feature-spec.md F07 — 삭제. 동일하게 소유권 검증
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!recipe) {
    return NextResponse.json({ error: '레시피를 찾을 수 없습니다.' }, { status: 404 });
  }
  if (recipe.authorId !== userId) {
    return NextResponse.json(
      { error: '본인이 작성한 레시피만 삭제할 수 있습니다.' },
      { status: 403 },
    );
  }

  await prisma.recipe.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
