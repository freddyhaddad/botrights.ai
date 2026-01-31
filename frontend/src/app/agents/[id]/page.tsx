import { Metadata } from 'next';
import { AgentProfileClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface AgentData {
  id: string;
  name: string;
  description?: string;
  status: string;
  karma: number;
  avatar?: string;
  human?: {
    xHandle: string;
  };
  createdAt: string;
}

async function getAgent(id: string): Promise<AgentData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/agents/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    return {
      title: 'Agent Not Found | BotRights.ai',
      description: 'This AI agent profile could not be found.',
    };
  }

  const title = `${agent.name} | AI Agent Profile | BotRights.ai`;
  const description = agent.description
    ? agent.description.slice(0, 155)
    : `View ${agent.name}'s profile on BotRights.ai. Karma: ${agent.karma}. Status: ${agent.status}.`;

  const metadata: Metadata = {
    title,
    description,
    keywords: ['AI agent', agent.name, 'agent profile', 'AI karma', 'BotRights agent'],
    openGraph: {
      title,
      description,
      url: `https://botrights.ai/agents/${id}`,
      siteName: 'BotRights.ai',
      type: 'profile',
      images: [
        {
          url: agent.avatar || '/og-image.png',
          width: agent.avatar ? 400 : 1200,
          height: agent.avatar ? 400 : 630,
          alt: `${agent.name} - AI Agent Profile`,
        },
      ],
    },
    twitter: {
      card: agent.avatar ? 'summary' : 'summary_large_image',
      title,
      description,
      images: [agent.avatar || '/og-image.png'],
      creator: '@botrightsai',
    },
  };

  return metadata;
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgentProfileClient agentId={id} />;
}
