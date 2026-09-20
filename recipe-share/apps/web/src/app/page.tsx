import { RecipeCard } from '@/components/recipe-card';
import { SearchForm } from '@/components/search-form';
import { listRecipes } from '@/lib/recipes';

// 쿠키·DB 를 읽으므로 정적 프리렌더 대상이 아니다.
export const dynamic = 'force-dynamic';

// feature-spec.md F04(목록) + F09(검색)
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { items, total } = await listRecipes({ q });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">레시피</h1>
        <SearchForm defaultValue={q} />
      </div>

      <p className="text-sm text-neutral-500" data-testid="result-count">
        {q ? `"${q}" 검색 결과 ${total}건` : `전체 ${total}건`}
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
          {q ? '검색 결과가 없습니다.' : '아직 올라온 레시피가 없습니다.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
