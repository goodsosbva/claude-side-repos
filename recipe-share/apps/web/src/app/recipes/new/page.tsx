import { redirect } from 'next/navigation';
import { RecipeForm } from '@/components/recipe-form';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// feature-spec.md F03(작성) + F06(사진)
// F10 가드는 API 에도 있고 여기에도 있다. 여기 것은 편의(빈 폼을 보여주지 않음),
// 실제 차단은 API 쪽이 담당한다.
export default async function NewRecipePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">레시피 쓰기</h1>
      <RecipeForm />
    </div>
  );
}
