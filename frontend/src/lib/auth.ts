import NextAuth from 'next-auth';
import Twitter from 'next-auth/providers/twitter';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Only configure Twitter provider if credentials are available
const providers = [];
if (process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET) {
  providers.push(
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
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
