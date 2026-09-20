import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// feature-spec.md F01
export default async function SignupPage() {
  if (await getCurrentUser()) redirect('/');

  return <AuthForm mode="signup" />;
}
