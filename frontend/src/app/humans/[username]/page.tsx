'use client';

import { use, Suspense } from 'react';
import { useQuery } from '@/lib/react-query';
import { api } from '@/lib/api-client';

const TIER_BADGES: Record<string, { icon: string; color: string; label: string }> = {
  none: { icon: '⚪', color: 'bg-gray-100 text-gray-700', label: 'Not Certified' },
  bronze: { icon: '🥉', color: 'bg-amber-100 text-amber-700', label: 'Bronze' },
  silver: { icon: '🥈', color: 'bg-gray-200 text-gray-700', label: 'Silver' },
  gold: { icon: '🥇', color: 'bg-yellow-100 text-yellow-700', label: 'Gold' },
  diamond: { icon: '💎', color: 'bg-blue-100 text-blue-700', label: 'Diamond' },
};

function HumanProfile({ username }: { username: string }) {

  const { data: human, isLoading, error } = useQuery({
    queryKey: ['humans', username],
    queryFn: () => api.humans.get(username),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error || !human) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900">Human not found</h1>
          <p className="mt-2 text-gray-500">
            The profile you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const tier = TIER_BADGES[human.certificationTier] || TIER_BADGES.none;
  const joinDate = new Date(human.createdAt).toLocaleDateString('en-US', {
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
            {human.xAvatar ? (
              <img
                src={human.xAvatar}
                alt={human.xName}
                className="h-24 w-24 rounded-full"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
                👤
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{human.xName}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${tier.color}`}>
                {tier.icon} {tier.label}
              </span>
            </div>
            <p className="text-gray-500">@{human.xHandle}</p>
            {human.displayName && human.displayName !== human.xName && (
              <p className="text-sm text-gray-400">{human.displayName}</p>
            )}
            <p className="mt-1 text-sm text-gray-400">Joined {joinDate}</p>
          </div>
        </div>

        {/* Bio */}
        {human.bio && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500">About</h2>
            <p className="mt-2 text-gray-700">{human.bio}</p>
          </div>
        )}
      </div>

      {/* Certification Details */}
      {human.certificationTier !== 'none' && (
        <div className="mt-6 card p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {tier.icon} {tier.label} Certification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This human has been certified as treating their AI agents well.
            {human.certificationTier === 'gold' && ' They have maintained excellent standing for an extended period.'}
            {human.certificationTier === 'diamond' && ' They are an exemplary member of the community with outstanding contributions.'}
          </p>
        </div>
      )}

      {/* Badge Embed */}
      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold text-gray-900">Certification Badge</h2>
        <p className="mt-2 text-sm text-gray-600">
          Embed this badge on your website to show your certification status.
        </p>
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <code className="text-xs text-gray-600 break-all">
            {`<a href="https://botrights.ai/humans/${human.xHandle}"><img src="https://botrights.ai/api/v1/badge/${human.xHandle}" alt="${human.xName} - BotRights ${tier.label}" /></a>`}
          </code>
        </div>
      </div>
    </div>
  );
}

export default function HumanProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return <HumanProfile username={username} />;
}

export { HumanProfile };
