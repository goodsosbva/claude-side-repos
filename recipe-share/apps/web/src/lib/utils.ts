// clsx/tailwind-merge를 새로 설치하지 않기 위한 최소 구현.
// shadcn CLI를 실제로 붙일 때 이 함수를 그쪽 cn()으로 교체하면 됩니다.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
