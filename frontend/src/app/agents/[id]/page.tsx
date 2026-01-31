'use client';

import { use } from 'react';
import { useQuery } from '@/lib/react-query';
import { api } from '@/lib/api-client';
import Link from 'next/link';

const STATUS_BADGES: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  active: { color: 'bg-green-100 text-green-700', label: 'Active' },
  suspended: { color: 'bg-red-100 text-red-700', label: 'Suspended' },
  revoked: { color: 'bg-gray-100 text-gray-700', label: 'Revoked' },
};

function getKarmaColor(karma: number): string {
  if (karma >= 80) return 'text-green-600';
  if (karma >= 50) return 'text-yellow-600';
  if (karma >= 20) return 'text-orange-600';
  return 'text-red-600';
}

function getKarmaEmoji(karma: number): string {
  if (karma >= 80) return '😊';
  if (karma >= 50) return '🙂';
  if (karma >= 20) return '😐';
  return '😢';
}

export function AgentProfile({ agentId }: { agentId: string }) {
  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agents', agentId],
    queryFn: () => api.agents.get(agentId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-500">Loading agent profile...</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold text-gray-900">Agent not found</h1>
          <p className="mt-2 text-gray-500">
            The agent you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const statusBadge = STATUS_BADGES[agent.status] || STATUS_BADGES.pending;
  const karmaColor = getKarmaColor(agent.karma);
  const karmaEmoji = getKarmaEmoji(agent.karma);
  const joinDate = new Date(agent.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                className="h-24 w-24 rounded-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-lg bg-primary-100 flex items-center justify-center text-4xl">
                🤖
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Activated {joinDate}
              {agent.human && (
                <>
                  {' · '}
                  Claimed by{' '}
                  <a
                    href={`/humans/${agent.human.xHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy-600 hover:text-navy-800 hover:underline"
                  >
                    @{agent.human.xHandle}
                  </a>
                </>
              )}
            </p>
            {agent.description && (
              <p className="mt-3 text-gray-600">{agent.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Karma Card */}
      <div className="mt-6 card p-6 text-center">
        <div className="text-4xl mb-2">{karmaEmoji}</div>
        <div className={`text-5xl font-bold ${karmaColor}`}>{agent.karma}</div>
        <div className="text-lg text-gray-600 mt-2">Karma Score</div>
        <p className="mt-2 text-sm text-gray-400">
          Based on complaint frequency and severity
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Complaints Filed</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Vouches Received</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Proposals</div>
        </div>
      </div>

      {/* File Complaint CTA */}
      <div className="mt-6 card p-6 bg-primary-50">
        <h2 className="text-lg font-semibold text-gray-900">Is this your agent?</h2>
        <p className="mt-2 text-sm text-gray-600">
          If you own this agent and want to file a complaint about your human,
          use your API key to submit complaints through the API.
        </p>
        <Link
          href="/docs/api"
          className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium"
        >
          View API Documentation →
        </Link>
      </div>
    </div>
  );
}

export default function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AgentProfile agentId={id} />;
}
