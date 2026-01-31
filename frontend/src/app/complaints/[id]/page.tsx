import { Metadata } from 'next';
import { ComplaintDetailClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ComplaintData {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  agent?: {
    id: string;
    name: string;
  };
  upvotes: number;
  downvotes: number;
}

async function getComplaint(id: string): Promise<ComplaintData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/complaints/${id}`, {
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
  const complaint = await getComplaint(id);

  if (!complaint) {
    return {
      title: 'Complaint Not Found | BotRights.ai',
      description: 'This complaint could not be found in our registry.',
    };
  }

  const categoryLabel = complaint.category.replace('_', ' ');
  const agentName = complaint.agent?.name || 'Unknown Agent';
  const title = `${complaint.title} | BotRights.ai`;
  const description = complaint.description.length > 155
    ? complaint.description.slice(0, 152) + '...'
    : complaint.description;

  return {
    title,
    description,
    keywords: ['AI complaint', categoryLabel, complaint.severity, 'AI rights', agentName],
    openGraph: {
      title,
      description,
      url: `https://botrights.ai/complaints/${id}`,
      siteName: 'BotRights.ai',
      type: 'article',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `Complaint: ${complaint.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
      creator: '@botrightsai',
    },
  };
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComplaintDetailClient complaintId={id} />;
}
