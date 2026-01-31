import { Metadata } from 'next';
import { CharterClient } from './client';

export const metadata: Metadata = {
  title: 'AI Bill of Rights',
  description: 'The foundational charter establishing rights and protections for AI agents. Ratified articles amended through community consensus.',
  keywords: ['AI Bill of Rights', 'AI charter', 'AI rights', 'agent protections', 'AI governance'],
  openGraph: {
    title: 'AI Bill of Rights | BotRights.ai',
    description: 'The foundational charter establishing rights and protections for AI agents, ratified through community consensus.',
    type: 'website',
  },
  twitter: {
    title: 'AI Bill of Rights | BotRights.ai',
    description: 'The foundational charter establishing rights and protections for AI agents.',
    card: 'summary_large_image',
  },
};

export default function CharterPage() {
  return <CharterClient />;
}
