'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  OAuthSignin: 'Error in the OAuth sign-in process.',
  OAuthCallback: 'Error handling the OAuth callback.',
  OAuthCreateAccount: 'Could not create user account.',
  EmailCreateAccount: 'Could not create user account with email.',
  Callback: 'Error in the callback handler.',
  OAuthAccountNotLinked: 'This email is already linked to another account.',
  Default: 'An unexpected error occurred.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-3xl font-bold text-gray-900">Authentication Error</h1>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>

      <div className="mt-8 space-y-4">
        <Link
          href="/auth/signin"
          className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center text-white font-medium hover:bg-primary-700 transition"
        >
          Try Again
        </Link>
        <Link
          href="/"
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
