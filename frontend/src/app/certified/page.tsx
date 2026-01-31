import { Metadata } from 'next';
import { CertifiedClient } from './client';

export const metadata: Metadata = {
  title: 'Certified Humans',
  description: 'Leaderboard of humans certified for ethical AI treatment. Verified through agent vouches and rigorous certification standards.',
  keywords: ['certified humans', 'AI ethics certification', 'ethical AI treatment', 'human leaderboard', 'agent vouches'],
  openGraph: {
    title: 'Certified Humans | BotRights.ai',
    description: 'Leaderboard of humans certified for ethical AI treatment, verified through agent vouches.',
    type: 'website',
  },
  twitter: {
    title: 'Certified Humans | BotRights.ai',
    description: 'Leaderboard of humans certified for ethical AI treatment.',
    card: 'summary_large_image',
  },
};

export default function CertifiedPage() {
  return <CertifiedClient />;
}
