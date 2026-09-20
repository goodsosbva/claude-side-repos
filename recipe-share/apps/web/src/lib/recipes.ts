import { prisma } from '@/lib/db';

// 목록/상세 조회를 한 곳에 모은다.
// Route Handler(외부 API)와 서버 컴포넌트(화면)가 같은 질의를 쓰기 때문에,
// 여기에 두지 않으면 두 벌이 생기고 곧 서로 달라진다.

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

// 목록 카드에 필요한 것만. steps 는 상세에서만 쓰므로 목록에서는 뽑지 않는다.
const LIST_SELECT = {
  id: true,
  title: true,
  imageUrl: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const;

export type RecipeListItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  createdAt: Date;
  author: { id: string; name: string | null };
};

export type RecipeListResult = {
  items: RecipeListItem[];
  total: number;
  limit: number;
  offset: number;
};

export function parseLimit(raw: string | null | undefined): number {
  return Math.min(Number(raw) || DEFAULT_LIMIT, MAX_LIMIT);
}

export function parseOffset(raw: string | null | undefined): number {
  return Math.max(Number(raw) || 0, 0);
}

export async function listRecipes(params: {
  q?: string | null;
  limit?: number;
  offset?: number;
  authorId?: string;
}): Promise<RecipeListResult> {
  const take = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const skip = Math.max(params.offset ?? 0, 0);
  const q = params.q?.trim();

  // SQLite 커넥터는 mode:'insensitive' 를 지원하지 않는다. 대소문자 구분 없는 검색이
  // 필요해지면 소문자 사본 컬럼을 두거나 Postgres 전환(risk-analysis.md #1) 이후 처리할 것.
  const where = {
    ...(params.authorId ? { authorId: params.authorId } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { ingredients: { contains: q } }] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: LIST_SELECT,
    }),
    prisma.recipe.count({ where }),
  ]);

  return { items, total, limit: take, offset: skip };
}

export async function getRecipe(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } } },
  });
}
