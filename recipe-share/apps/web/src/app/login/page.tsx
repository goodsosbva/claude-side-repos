import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// feature-spec.md F02
export default async function LoginPage() {
  // 이미 로그인한 사람에게 로그인 화면을 보일 이유가 없다.
  if (await getCurrentUser()) redirect('/');

  return <AuthForm mode="login" />;
}
