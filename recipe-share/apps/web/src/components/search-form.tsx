import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 일부러 JS 없는 GET 폼이다. 검색 결과가 URL 에 남아야 공유·새로고침이 되고,
// 이러면 클라이언트 컴포넌트를 하나 덜 만든다. (feature-spec.md F09)
export function SearchForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <form action="/" method="get" className="flex gap-2" role="search">
      <label htmlFor="q" className="sr-only">
        검색어
      </label>
      <Input
        id="q"
        name="q"
        type="search"
        placeholder="제목이나 재료로 검색"
        defaultValue={defaultValue}
      />
      <Button type="submit">검색</Button>
    </form>
  );
}
