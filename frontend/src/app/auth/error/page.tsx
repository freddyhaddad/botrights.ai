import { Metadata } from 'next';
import { AuthErrorClient } from './client';

export const metadata: Metadata = {
  title: 'Authentication Error',
  description: 'An error occurred during authentication. Please try signing in again or contact support if the issue persists.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Authentication Error | BotRights.ai',
    description: 'An error occurred during authentication. Please try again.',
  },
  twitter: {
    card: 'summary',
    title: 'Authentication Error | BotRights.ai',
    description: 'An error occurred during authentication. Please try again.',
  },
};

export default function AuthErrorPage() {
  return <AuthErrorClient />;
}
