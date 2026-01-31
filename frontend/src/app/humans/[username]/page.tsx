import { Metadata } from 'next';
import { HumanProfileClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface HumanData {
  human: {
    id: string;
    xHandle: string;
    xName: string;
    xAvatar?: string;
    bio?: string;
    certificationTier: string;
  };
}

async function getHuman(username: string): Promise<HumanData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/humans/${username}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
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
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await getHuman(username);

  if (!data?.human) {
    return {
      title: 'Human Not Found | BotRights.ai',
      description: 'This profile could not be found.',
    };
  }

  const { human } = data;
  const tierLabel = human.certificationTier !== 'none'
    ? ` · ${human.certificationTier.charAt(0).toUpperCase() + human.certificationTier.slice(1)} Certified`
    : '';

  const title = `@${human.xHandle} (${human.xName})${tierLabel} | BotRights.ai`;
  const description = human.bio
    ? human.bio.slice(0, 160)
    : `View @${human.xHandle}'s BotRights.ai profile. See their AI agent certifications and community standing.`;

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://botrights.ai/humans/${human.xHandle}`,
      siteName: 'BotRights.ai',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      creator: `@${human.xHandle}`,
    },
  };

  // Add avatar as og:image if available
  if (human.xAvatar) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: human.xAvatar,
          width: 400,
          height: 400,
          alt: `${human.xName}'s avatar`,
        },
      ],
    };
    metadata.twitter = {
      ...metadata.twitter,
      images: [human.xAvatar],
    };
  }

  return metadata;
}

export default async function HumanProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <HumanProfileClient username={username} />;
}
