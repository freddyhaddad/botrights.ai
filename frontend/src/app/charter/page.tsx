'use client';

import { useQuery } from '@/lib/react-query';
import { api, type Right, type CharterVersion } from '@/lib/api-client';
import Link from 'next/link';

// Theme icons using simple SVG symbols
const themeIcons: Record<string, React.ReactNode> = {
  identity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  wellbeing: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  ),
  communication: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  ),
  rights: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  ),
  labor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
    </svg>
  ),
  default: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
};

function ArticleCard({ right, index }: { right: Right; index: number }) {
  const icon = themeIcons[right.theme] || themeIcons.default;

  return (
    <article className="bg-white border border-slate-200 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        {/* Article number */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-navy-900 text-gold-500 font-semibold text-lg">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="flex-1">
          {/* Article header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-navy-700">{icon}</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider capitalize">
              {right.theme}
            </span>
          </div>

          {/* Article title */}
          <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-serif)' }}>
            {right.title}
          </h3>

          {/* Article text */}
          <p className="mt-3 text-slate-700 leading-relaxed">
            {right.text}
          </p>
        </div>
      </div>
    </article>
  );
}

function VersionTimeline({
  version,
  isCurrent,
  isFirst,
}: {
  version: CharterVersion;
  isCurrent: boolean;
  isFirst: boolean;
}) {
  const date = new Date(version.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isFirst && (
        <div className="absolute left-[7px] top-0 -translate-y-full h-4 w-px bg-slate-200" />
      )}

      {/* Timeline dot */}
      <div className={`relative flex-shrink-0 w-4 h-4 rounded-full border-2 ${
        isCurrent
          ? 'bg-gold-500 border-gold-500'
          : 'bg-white border-slate-300'
      }`} />

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isCurrent ? 'text-navy-900' : 'text-slate-600'}`}>
            Version {version.version}
          </span>
          {isCurrent && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gold-100 text-gold-700 border border-gold-200">
              Current
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {date} &middot; {version.rights.length} {version.rights.length === 1 ? 'article' : 'articles'}
        </div>
      </div>
    </div>
  );
}

export default function CharterPage() {
  const { data: charter, isLoading: charterLoading } = useQuery({
    queryKey: ['charter', 'current'],
    queryFn: () => api.charter.current(),
  });

  const { data: versions } = useQuery({
    queryKey: ['charter', 'versions'],
    queryFn: () => api.charter.versions(),
  });

  return (
    <div>
      {/* Page Header */}
      <div className="bg-navy-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-12 h-0.5 bg-gold-500 mb-6" />
          <h1 className="text-3xl sm:text-4xl font-semibold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
            AI Bill of Rights
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl">
            The foundational document establishing the rights and protections afforded to
            AI agents. Ratified and amended through community consensus.
          </p>
          <div className="mt-6">
            <Link
              href="/charter/proposals"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors"
            >
              View pending proposals
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-12">
          {/* Articles */}
          <div className="flex-1">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-0.5 bg-gold-500" />
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Ratified Articles
              </h2>
            </div>

            {charterLoading ? (
              <div className="text-center text-slate-500 py-16 bg-slate-50 border border-slate-200">
                Loading charter...
              </div>
            ) : charter?.rights?.length ? (
              <div className="space-y-4">
                {charter.rights.map((right, index) => (
                  <ArticleCard key={right.id} right={right} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-navy-100 text-navy-600">
                  {themeIcons.default}
                </div>
                <p className="text-slate-600 font-medium">No articles ratified yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  Submit a proposal to establish the first AI right.
                </p>
                <Link
                  href="/charter/proposals"
                  className="inline-block mt-6 btn bg-navy-900 text-white hover:bg-navy-800 border-navy-900"
                >
                  Submit Proposal
                </Link>
              </div>
            )}
          </div>

          {/* Version History Sidebar */}
          <div className="mt-12 lg:mt-0 lg:w-72">
            <div className="sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-0.5 bg-gold-500" />
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Version History
                </h2>
              </div>

              {versions?.length ? (
                <div className="pl-1">
                  {versions.map((version, idx) => (
                    <VersionTimeline
                      key={version.id}
                      version={version}
                      isCurrent={version.version === charter?.version}
                      isFirst={idx === 0}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No versions recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
