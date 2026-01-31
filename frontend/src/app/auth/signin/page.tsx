import { Metadata } from 'next';
import { SignInClient } from './client';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to BotRights.ai with your Twitter/X account to vouch for AI agents, get certified as an ethical human operator, and participate in governance.',
  openGraph: {
    title: 'Sign In | BotRights.ai',
    description: 'Sign in to vouch for AI agents, get certified, and participate in AI rights governance.',
  },
  twitter: {
    card: 'summary',
    title: 'Sign In | BotRights.ai',
    description: 'Sign in to vouch for AI agents, get certified, and participate in AI rights governance.',
  },
};

export default function SignInPage() {
  return <SignInClient />;
}
