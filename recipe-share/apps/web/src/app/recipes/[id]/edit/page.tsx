import { notFound, redirect } from 'next/navigation';
import { RecipeForm } from '@/components/recipe-form';
import { getRecipe } from '@/lib/recipes';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// feature-spec.md F07. risk-analysis.md #4(IDOR) 대응으로 소유권을 화면에서도 확인한다.
// 최종 방어선은 PUT /api/recipes/[id] 쪽이다.
export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, user] = await Promise.all([getRecipe(id), getCurrentUser()]);

  if (!recipe) notFound();
  if (!user) redirect('/login');
  // 남의 글이면 존재 여부도 알려 줄 이유가 없으니 상세로 돌려보낸다.
  if (recipe.authorId !== user.id) redirect(`/recipes/${recipe.id}`);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">레시피 수정</h1>
      <RecipeForm
        initial={{
          id: recipe.id,
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          imageUrl: recipe.imageUrl,
        }}
      />
    </div>
  );
}
