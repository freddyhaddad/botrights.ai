import NextAuth from 'next-auth';
import Twitter from 'next-auth/providers/twitter';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Configure Twitter OAuth 2.0 provider with explicit URLs
const providers = [
  Twitter({
    clientId: process.env.AUTH_TWITTER_ID!,
    clientSecret: process.env.AUTH_TWITTER_SECRET!,
    authorization: {
      url: 'https://x.com/i/oauth2/authorize',
      params: {
        // Twitter OAuth 2.0 requires tweet.read as base scope
        scope: 'tweet.read users.read offline.access',
      },
    },
    token: {
      url: 'https://api.x.com/2/oauth2/token',
    },
    userinfo: {
      url: 'https://api.x.com/2/users/me',
      params: {
        'user.fields': 'id,name,username,profile_image_url',
      },
    },
  }),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  // Trust the host header on Vercel (required for NextAuth v5)
  trustHost: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign in, exchange the Twitter tokens with our backend
      if (account && profile) {
        // Extract username from profile (NextAuth Twitter returns nested data)
        const username = profile.username || (profile as { data?: { username?: string } }).data?.username;
        const twitterId = profile.id || (profile as { data?: { id?: string } }).data?.id;
        const name = profile.name || (profile as { data?: { name?: string } }).data?.name;
        const image = profile.image || (profile as { data?: { profile_image_url?: string } }).data?.profile_image_url;

        // IMPORTANT: Set username from Twitter profile IMMEDIATELY as fallback
        // This ensures we have the username even if the backend call fails
        if (username) {
          token.username = username;
        }
        if (twitterId) {
          token.twitterId = twitterId;
        }

        // Attempt backend token exchange - but continue with Twitter data if it fails
        try {
          const response = await fetch(`${API_URL}/api/v1/auth/twitter/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: account.access_token,
              twitterId,
              username,
              name,
              image,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            token.backendToken = data.token;
            token.humanId = data.humanId;
            // Backend may return username too, use it if available
            if (data.username) {
              token.username = data.username;
            }
          } else {
            // Backend failed - log with context but continue with Twitter profile data
            const errorText = await response.text();
            console.error(
              `Backend token exchange failed for user ${username} (twitterId: ${twitterId}):`,
              response.status,
              errorText
            );
            // Continue without backend token - username from Twitter profile is still set
          }
        } catch (error) {
          // Network or other error - log with context but continue with Twitter profile data
          console.error(
            `Failed to exchange token with backend for user ${username} (twitterId: ${twitterId}):`,
            error
          );
          // Continue without backend token - username from Twitter profile is still set
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add backend token to session for API calls
      if (token.backendToken) {
        session.backendToken = token.backendToken as string;
      }
      if (token.humanId) {
        session.humanId = token.humanId as string;
      }
      if (token.username) {
        session.username = token.username as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is the base URL (default redirect) or just "/", redirect to profile
      // We need to check if this is a post-signin redirect
      if (url === baseUrl || url === `${baseUrl}/` || url === '/') {
        // Return a placeholder - the actual redirect will be handled client-side
        // since we need the username from the session
        return `${baseUrl}/auth/redirect`;
      }
      // For other URLs, allow them if they're on the same origin
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // For relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

// Extend the session type
declare module 'next-auth' {
  interface Session {
    backendToken?: string;
    humanId?: string;
    username?: string;
  }
}
