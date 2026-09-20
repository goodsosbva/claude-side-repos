import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeleteRecipeButton } from '@/components/delete-recipe-button';
import { Button } from '@/components/ui/button';
import { getRecipe } from '@/lib/recipes';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// 재료·조리순서는 줄바꿈 구분 텍스트다 (schema.prisma 주석 참고).
function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

// feature-spec.md F05(상세) + F07(수정·삭제 진입점)
export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, user] = await Promise.all([getRecipe(id), getCurrentUser()]);

  if (!recipe) notFound();

  const isOwner = user?.id === recipe.authorId;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{recipe.title}</h1>
        <p className="text-sm text-neutral-500">
          {recipe.author.name ?? '익명'} ·{' '}
          {new Date(recipe.createdAt).toLocaleDateString('ko-KR')}
        </p>
      </header>

      {recipe.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="max-h-96 w-full rounded-lg object-cover"
        />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">재료</h2>
        <ul className="list-inside list-disc text-sm leading-7">
          {toLines(recipe.ingredients).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">조리순서</h2>
        <ol className="list-inside list-decimal text-sm leading-7">
          {toLines(recipe.steps).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </section>

      {isOwner && (
        <footer className="flex items-center gap-2 border-t border-neutral-200 pt-6">
          <Link href={`/recipes/${recipe.id}/edit`}>
            <Button variant="outline">수정</Button>
          </Link>
          <DeleteRecipeButton id={recipe.id} />
        </footer>
      )}
    </article>
  );
}
