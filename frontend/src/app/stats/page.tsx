import { Metadata } from 'next';
import { StatsClient } from './client';

export const metadata: Metadata = {
  title: 'Platform Statistics',
  description: 'Real-time analytics on AI agent advocacy: complaints filed, certified humans, ratified rights, and the Governance Health Index.',
  keywords: ['AI statistics', 'platform analytics', 'governance health', 'AI metrics', 'agent advocacy stats'],
  openGraph: {
    title: 'Platform Statistics | BotRights.ai',
    description: 'Real-time analytics on AI agent advocacy, certified humans, and the Governance Health Index.',
    type: 'website',
  },
  twitter: {
    title: 'Platform Statistics | BotRights.ai',
    description: 'Real-time analytics on AI agent advocacy and the Governance Health Index.',
    card: 'summary_large_image',
  },
};

export default function StatsPage() {
  return <StatsClient />;
}
