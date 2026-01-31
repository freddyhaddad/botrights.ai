import NextAuth from 'next-auth';
import Twitter from 'next-auth/providers/twitter';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Configure Twitter OAuth 2.0 provider with explicit URLs
const providers = [
  Twitter({
    clientId: process.env.AUTH_TWITTER_ID!,
    clientSecret: process.env.AUTH_TWITTER_SECRET!,
    authorization: {
      url: 'https://twitter.com/i/oauth2/authorize',
      params: {
        // Twitter OAuth 2.0 requires tweet.read as base scope
        scope: 'tweet.read users.read offline.access',
      },
    },
    token: {
      url: 'https://api.twitter.com/2/oauth2/token',
    },
    userinfo: {
      url: 'https://api.twitter.com/2/users/me',
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
        try {
          const response = await fetch(`${API_URL}/api/v1/auth/twitter/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: account.access_token,
              twitterId: profile.id || (profile as { data?: { id?: string } }).data?.id,
              username: profile.username || (profile as { data?: { username?: string } }).data?.username,
              name: profile.name || (profile as { data?: { name?: string } }).data?.name,
              image: profile.image || (profile as { data?: { profile_image_url?: string } }).data?.profile_image_url,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            token.backendToken = data.token;
            token.humanId = data.humanId;
          }
        } catch (error) {
          console.error('Failed to exchange token with backend:', error);
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
      return session;
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
  }
}
