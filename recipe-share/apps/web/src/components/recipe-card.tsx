import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RecipeListItem } from '@/lib/recipes';

export function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md" data-testid="recipe-card">
      <Link href={`/recipes/${recipe.id}`}>
        {recipe.imageUrl ? (
          // 업로드 이미지는 next/image 최적화를 태우지 않는다.
          // 사용자가 올린 임의의 파일이라 최적화 이득보다 실패 경로가 더 성가시다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt=""
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-neutral-100 text-sm text-neutral-400">
            사진 없음
          </div>
        )}

        <CardHeader>
          <CardTitle>{recipe.title}</CardTitle>
        </CardHeader>

        <CardContent className="text-sm text-neutral-500">
          {recipe.author.name ?? '익명'} ·{' '}
          {new Date(recipe.createdAt).toLocaleDateString('ko-KR')}
        </CardContent>
      </Link>
    </Card>
  );
}
