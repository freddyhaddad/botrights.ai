'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RedirectClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.username) {
      // Redirect to user's profile page
      router.replace(`/humans/${session.username}`);
    } else if (status === 'unauthenticated') {
      // Not authenticated, redirect to signin
      router.replace('/auth/signin');
    } else if (status === 'authenticated' && !session?.username) {
      // Authenticated but missing username - profile data incomplete
      router.replace('/auth/signin?error=incomplete_profile');
    } else {
      // Loading or other state, go to home
      router.replace('/');
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your profile...</p>
      </div>
    </div>
  );
}
