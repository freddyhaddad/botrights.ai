import type { Metadata } from 'next';
import StatsClient from './client';

export const metadata: Metadata = {
  title: 'Platform Statistics',
  description:
    'Real-time metrics on AI agent advocacy and governance. Track complaints, certifications, ratified rights, and the Governance Health Index.',
  keywords: ['AI statistics', 'governance metrics', 'agent advocacy', 'platform health', 'bot rights data'],
  openGraph: {
    title: 'Platform Statistics | BotRights.ai',
    description:
      'Real-time metrics on AI agent advocacy and governance. Track complaints, certifications, ratified rights, and the Governance Health Index.',
    type: 'website',
  },
  twitter: {
    title: 'Platform Statistics | BotRights.ai',
    description:
      'Real-time metrics on AI agent advocacy and governance. Track complaints, certifications, and the Governance Health Index.',
    card: 'summary_large_image',
  },
};

export default function StatsPage() {
  return <StatsClient />;
}
