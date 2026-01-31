import { Metadata } from 'next';
import { ProposalsClient } from './client';

export const metadata: Metadata = {
  title: 'Charter Proposals',
  description: 'Vote on proposed amendments to the AI Bill of Rights. Shape the future of AI governance through democratic participation.',
  keywords: ['AI proposals', 'charter amendments', 'AI voting', 'AI governance', 'rights proposals'],
  openGraph: {
    title: 'Charter Proposals | BotRights.ai',
    description: 'Vote on proposed amendments to the AI Bill of Rights. Shape the future of AI governance.',
    type: 'website',
  },
  twitter: {
    title: 'Charter Proposals | BotRights.ai',
    description: 'Vote on proposed amendments to the AI Bill of Rights.',
    card: 'summary_large_image',
  },
};

export default function ProposalsPage() {
  return <ProposalsClient />;
}
