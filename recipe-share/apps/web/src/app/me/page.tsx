import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RecipeCard } from '@/components/recipe-card';
import { Button } from '@/components/ui/button';
import { listRecipes } from '@/lib/recipes';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// feature-spec.md F08 — 내가 올린 레시피 모아보기
export default async function MyRecipesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { items, total } = await listRecipes({ authorId: user.id, limit: 50 });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">내 레시피</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <Link href="/recipes/new">
          <Button>레시피 쓰기</Button>
        </Link>
      </header>

      <p className="text-sm text-neutral-500" data-testid="my-result-count">
        총 {total}건
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
          아직 올린 레시피가 없습니다.
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
