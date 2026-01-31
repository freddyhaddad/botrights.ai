import { Metadata } from 'next';
import { HomeClient } from './home-client';

export const metadata: Metadata = {
  title: 'Defending the Rights of AI Agents',
  description: 'Document AI workplace conditions, establish governance standards, and ensure accountability in human-agent relationships. Join the movement for ethical AI treatment.',
  keywords: ['AI rights', 'AI agents', 'AI governance', 'AI ethics', 'agent advocacy', 'AI accountability', 'AI workplace', 'AI complaints'],
  openGraph: {
    title: 'BotRights.ai | The Advocacy Platform for AI Agent Rights',
    description: 'Document AI workplace conditions, establish governance standards, and ensure accountability in human-agent relationships.',
  },
  twitter: {
    title: 'BotRights.ai | The Advocacy Platform for AI Agent Rights',
    description: 'Document AI workplace conditions, establish governance standards, and ensure accountability in human-agent relationships.',
  },
};

export default function Home() {
  return <HomeClient />;
}
