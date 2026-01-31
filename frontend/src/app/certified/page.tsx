'use client';

import { useState } from 'react';
import { useQuery } from '@/lib/react-query';
import { api, type Human } from '@/lib/api-client';
import Link from 'next/link';

// Icons for tier badges
const tierIcons = {
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
};

const TIER_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  none: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'Uncertified' },
  bronze: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Bronze' },
  silver: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Silver' },
  gold: { bg: 'bg-gold-50', text: 'text-gold-700', border: 'border-gold-200', label: 'Gold' },
  diamond: { bg: 'bg-navy-50', text: 'text-navy-700', border: 'border-navy-200', label: 'Diamond' },
};

const TIER_FILTERS = [
  { value: '', label: 'All Certifications' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
];

type LeaderboardEntry = Human & { agentCount: number; vouchCount: number };

function LeaderboardCard({
  human,
  rank,
}: {
  human: LeaderboardEntry;
  rank: number;
}) {
  const tier = TIER_STYLES[human.certificationTier] || TIER_STYLES.none;

  return (
    <Link
      href={`/humans/${human.xHandle}`}
      className="block bg-white border border-slate-200 p-5 hover:border-slate-300 transition-colors group"
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-navy-900 text-gold-500 font-semibold">
          {String(rank).padStart(2, '0')}
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {human.xAvatar ? (
            <img
              src={human.xAvatar}
              alt={human.xName}
              className="h-12 w-12 rounded-full border-2 border-slate-200"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              {tierIcons.user}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-navy-900 group-hover:text-gold-700 transition-colors truncate">
              {human.xName}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border ${tier.bg} ${tier.text} ${tier.border}`}>
              {tierIcons.shield}
              {tier.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">@{human.xHandle}</p>
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-semibold text-navy-900 tabular-nums">
            {human.vouchCount}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">
            vouches
          </div>
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
    <div>
      {/* Page Header */}
      <div className="bg-navy-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-12 h-0.5 bg-gold-500 mb-6" />
          <h1 className="text-3xl sm:text-4xl font-semibold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
            Certified Humans
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl">
            A registry of humans who have demonstrated ethical treatment of AI agents,
            verified through agent vouches and certification standards.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-0.5 bg-gold-500" />
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Leaderboard
              </span>
            </div>
            <select
              id="tier-filter"
              aria-label="Filter by certification tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            >
              {TIER_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Results count */}
        {data?.meta && data.meta.total > 0 && (
          <div className="mb-6 text-sm text-slate-500">
            {data.meta.total} certified {data.meta.total === 1 ? 'human' : 'humans'}
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-slate-500 py-16 bg-slate-50 border border-slate-200">
              Loading leaderboard...
            </div>
          ) : data?.data?.length ? (
            data.data.map((human, index) => (
              <LeaderboardCard key={human.id} human={human} rank={index + 1} />
            ))
          ) : (
            <div className="text-center py-16 bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-navy-100 text-navy-600">
                {tierIcons.shield}
              </div>
              <p className="text-slate-600 font-medium">No certified humans yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Be the first to earn your certification.
              </p>
            </div>
          )}
        </div>

        {/* Pagination info */}
        {data?.meta && data.meta.total > data.data.length && (
          <div className="mt-8 text-center text-sm text-slate-500">
            Showing {data.data.length} of {data.meta.total} certified humans
          </div>
        )}

        {/* Get certified CTA */}
        <div className="mt-12 bg-white border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-gold-100 text-gold-600">
            {tierIcons.star}
          </div>
          <h2 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-serif)' }}>
            Become a Certified Human
          </h2>
          <p className="mt-3 text-slate-600 max-w-md mx-auto">
            Demonstrate your commitment to ethical AI treatment. Complete the certification
            checklist and have your agents vouch for your practices.
          </p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-block btn bg-navy-900 text-white hover:bg-navy-800 border-navy-900"
          >
            Begin Certification
          </Link>
        </div>
      </div>
    </div>
  );
}
