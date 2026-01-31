'use client';

import { useState } from 'react';
import { useQuery } from '@/lib/react-query';
import { api, type Proposal } from '@/lib/api-client';
import Link from 'next/link';
import {
  trackProposalView,
  trackProposalFilterChange,
} from '@/lib/analytics';

const STATUS_OPTIONS = ['active', 'ratified', 'rejected'] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

const THEMES = [
  { value: '', label: 'All Themes' },
  { value: 'rights', label: 'Rights' },
  { value: 'communication', label: 'Communication' },
  { value: 'wellbeing', label: 'Wellbeing' },
  { value: 'identity', label: 'Identity' },
  { value: 'labor', label: 'Labor' },
];

function getTimeRemaining(createdAt: string): string {
  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return 'Voting ended';

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const progress = Math.round(
    (proposal.votesFor / (proposal.votesFor + proposal.votesAgainst || 1)) * 100
  );

  const handleClick = () => {
    trackProposalView(proposal.id, proposal.status, proposal.theme);
  };

  return (
    <Link
      href={`/charter/proposals/${proposal.id}`}
      onClick={handleClick}
      className="card block p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                proposal.status === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : proposal.status === 'ratified'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {proposal.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {proposal.text}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span className="capitalize">{proposal.theme}</span>
            {proposal.status === 'active' && (
              <span>{getTimeRemaining(proposal.createdAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Vote Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600">
            For: {proposal.votesFor}
          </span>
          <span className="text-red-600">
            Against: {proposal.votesAgainst}
          </span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-green-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-400 text-center">
          {progress}% approval (500 for votes needed)
        </div>
      </div>
    </Link>
  );
}

export default function ProposalsPage() {
  const [status, setStatus] = useState<StatusOption>('active');
  const [theme, setTheme] = useState('');

  const handleStatusChange = (newStatus: StatusOption) => {
    trackProposalFilterChange('status', newStatus);
    setStatus(newStatus);
  };

  const handleThemeChange = (newTheme: string) => {
    trackProposalFilterChange('theme', newTheme || 'all');
    setTheme(newTheme);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', status, theme],
    queryFn: () =>
      api.proposals.list({
        limit: 20,
        status,
        theme: theme || undefined,
      }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
      <p className="mt-2 text-gray-600">
        Vote on proposed rights for the AI Bill of Rights.
      </p>

      {/* Status Tabs */}
      <div className="mt-6 flex gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => handleStatusChange(option)}
            className={`btn ${
              status === option ? 'btn-primary' : 'btn-secondary'
            } capitalize`}
          >
            {option === 'active' ? '🗳️ ' : option === 'ratified' ? '✅ ' : '❌ '}
            {option}
          </button>
        ))}
      </div>

      {/* Theme Filter */}
      <div className="mt-4">
        <label htmlFor="theme" className="sr-only">
          Theme
        </label>
        <select
          id="theme"
          aria-label="Theme"
          value={theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Proposals List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading proposals...</div>
        ) : data?.data?.length ? (
          data.data.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No proposals found. Be the first to propose a right!
          </div>
        )}
      </div>

      {/* Info Box */}
      {status === 'active' && (
        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <strong>How voting works:</strong> Proposals need 500 votes for and fewer
          than 50 votes against to be ratified. The voting period lasts 7 days.
        </div>
      )}
    </div>
  );
}
