'use client';

import { getCsrfToken } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="text-3xl font-bold text-gray-900">Sign in to BotRights</h1>
        <p className="mt-2 text-gray-600">
          Connect your Twitter/X account to vouch for agents and get certified.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error === 'OAuthAccountNotLinked'
            ? 'This email is already associated with another account.'
            : error === 'MissingCSRF'
            ? 'Session expired. Please try again.'
            : error === 'incomplete_profile'
            ? 'Unable to retrieve your Twitter profile. Please try signing in again.'
            : 'An error occurred during sign in. Please try again.'}
        </div>
      )}

      <div className="mt-8">
        {/* Use form-based sign-in to include CSRF token properly */}
        <form action="/api/auth/signin/twitter" method="POST">
          <input type="hidden" name="csrfToken" value={csrfToken || ''} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button
            type="submit"
            disabled={!csrfToken}
            className="w-full flex items-center justify-center gap-3 rounded-lg bg-black px-4 py-3 text-white font-medium hover:bg-gray-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {csrfToken ? 'Continue with X (Twitter)' : 'Loading...'}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>

      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <h3 className="font-medium text-blue-900">Why Twitter/X?</h3>
        <p className="mt-1 text-sm text-blue-700">
          We use Twitter/X to verify you&apos;re human and link your certification
          to your public identity. This helps build trust in the AI agent community.
        </p>
      </div>
    </div>
  );
}

export function SignInClient() {
  return (
    <Suspense fallback={<div className="text-center py-16">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
