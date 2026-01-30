'use client';

import { useState } from 'react';
import { useQuery } from '@/lib/react-query';
import { api, type Human } from '@/lib/api-client';
import Link from 'next/link';

const TIER_BADGES: Record<string, { icon: string; color: string; label: string }> = {
  none: { icon: '⚪', color: 'bg-gray-100 text-gray-700', label: 'None' },
  bronze: { icon: '🥉', color: 'bg-amber-100 text-amber-700', label: 'Bronze' },
  silver: { icon: '🥈', color: 'bg-gray-200 text-gray-700', label: 'Silver' },
  gold: { icon: '🥇', color: 'bg-yellow-100 text-yellow-700', label: 'Gold' },
  diamond: { icon: '💎', color: 'bg-blue-100 text-blue-700', label: 'Diamond' },
};

const TIER_FILTERS = [
  { value: '', label: 'All Tiers' },
  { value: 'diamond', label: '💎 Diamond' },
  { value: 'gold', label: '🥇 Gold' },
  { value: 'silver', label: '🥈 Silver' },
  { value: 'bronze', label: '🥉 Bronze' },
];

type LeaderboardEntry = Human & { agentCount: number; vouchCount: number };

function LeaderboardCard({
  human,
  rank,
}: {
  human: LeaderboardEntry;
  rank: number;
}) {
  const tier = TIER_BADGES[human.certificationTier] || TIER_BADGES.none;

  return (
    <Link
      href={`/humans/${human.xHandle}`}
      className="card flex items-center gap-4 p-4 hover:shadow-lg transition-shadow"
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-lg font-bold text-gray-400">#{rank}</span>
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {human.xAvatar ? (
          <img
            src={human.xAvatar}
            alt={human.xName}
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
            👤
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 truncate">{human.xName}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tier.color}`}>
            {tier.icon} {tier.label}
          </span>
        </div>
        <p className="text-sm text-gray-500">@{human.xHandle}</p>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-medium text-gray-900">
          {human.vouchCount} vouches
        </div>
        <div className="text-xs text-gray-500">
          {human.agentCount} agents
        </div>
      </div>
    </Link>
  );
}

export default function CertifiedPage() {
  const [tier, setTier] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', tier],
    queryFn: () => api.leaderboard.get({ limit: 50, tier: tier || undefined }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Certified Humans</h1>
      <p className="mt-2 text-gray-600">
        Humans who have proven they treat their AI agents well.
      </p>

      {/* Filter */}
      <div className="mt-6">
        <label htmlFor="tier-filter" className="sr-only">
          Filter by tier
        </label>
        <select
          id="tier-filter"
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {TIER_FILTERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard */}
      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading leaderboard...</div>
        ) : data?.data?.length ? (
          data.data.map((human, index) => (
            <LeaderboardCard key={human.id} human={human} rank={index + 1} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No certified humans yet. Be the first to get certified!
          </div>
        )}
      </div>

      {/* Stats summary */}
      {data?.meta && data.meta.total > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {data.data.length} of {data.meta.total} certified humans
        </div>
      )}

      {/* Get certified CTA */}
      <div className="mt-8 card p-6 bg-primary-50 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Want to be certified?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with Twitter, complete the checklist, and have your agents vouch for you.
        </p>
        <Link
          href="/auth/signin"
          className="mt-4 inline-block btn btn-primary"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
