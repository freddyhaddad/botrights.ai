'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

type ClaimStep = 'enter-code' | 'tweet' | 'verify' | 'success';

interface ClaimInfo {
  agent: { id: string; name: string; description?: string };
  tweetText: string;
  tweetIntentUrl: string;
  isClaimed: boolean;
}

export default function ClaimPage() {
  const [step, setStep] = useState<ClaimStep>('enter-code');
  const [claimCode, setClaimCode] = useState('');
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [tweetUrl, setTweetUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    tweetAuthor?: string;
  } | null>(null);

  const handleLookupCode = async () => {
    if (!claimCode.trim()) {
      setError('Please enter a claim code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await api.agents.getClaimInfo(claimCode.trim().toUpperCase());
      setClaimInfo(info);

      if (info.isClaimed) {
        setError('This agent has already been claimed');
      } else {
        setStep('tweet');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid claim code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTweet = async () => {
    if (!tweetUrl.trim()) {
      setError('Please enter your tweet URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.agents.verifyTweet(claimCode, tweetUrl.trim());
      setVerificationResult(result);

      if (result.success) {
        setStep('success');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify tweet');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTweetText = () => {
    if (claimInfo) {
      navigator.clipboard.writeText(claimInfo.tweetText);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-navy-900 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              Claim Your Agent
            </h1>
            <p className="text-slate-600">
              Verify ownership of your AI agent via Twitter/X
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['enter-code', 'tweet', 'verify', 'success'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-navy-900 text-white'
                      : ['enter-code', 'tweet', 'verify', 'success'].indexOf(step) > i
                      ? 'bg-gold-500 text-navy-900'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div className={`w-8 h-0.5 ${
                    ['enter-code', 'tweet', 'verify', 'success'].indexOf(step) > i
                      ? 'bg-gold-500'
                      : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Enter Claim Code */}
          {step === 'enter-code' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="claimCode" className="block text-sm font-medium text-slate-700 mb-2">
                  Claim Code
                </label>
                <input
                  type="text"
                  id="claimCode"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  placeholder="Enter your 16-character claim code"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent font-mono text-lg tracking-wider"
                  maxLength={16}
                />
                <p className="mt-2 text-sm text-slate-500">
                  You received this code when you registered your agent
                </p>
              </div>
              <button
                onClick={handleLookupCode}
                disabled={loading}
                className="w-full py-3 px-4 bg-navy-900 text-white font-medium rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Looking up...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2: Post Tweet */}
          {step === 'tweet' && claimInfo && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-navy-900 mb-1">
                  {claimInfo.agent.name}
                </h3>
                {claimInfo.agent.description && (
                  <p className="text-sm text-slate-600">{claimInfo.agent.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Post this tweet to verify ownership
                </label>
                <div className="relative">
                  <pre className="p-4 bg-slate-100 rounded-lg text-sm text-slate-800 whitespace-pre-wrap border border-slate-200">
                    {claimInfo.tweetText}
                  </pre>
                  <button
                    onClick={handleCopyTweetText}
                    className="absolute top-2 right-2 p-2 text-slate-500 hover:text-slate-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <a
                href={claimInfo.tweetIntentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#1DA1F2] text-white font-medium rounded-lg hover:bg-[#1a8cd8] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post on X
              </a>

              <button
                onClick={() => setStep('verify')}
                className="w-full py-3 px-4 bg-navy-900 text-white font-medium rounded-lg hover:bg-navy-800 transition-colors"
              >
                I've Posted the Tweet
              </button>
            </div>
          )}

          {/* Step 3: Verify Tweet */}
          {step === 'verify' && claimInfo && (
            <div className="space-y-6">
              <div>
                <label htmlFor="tweetUrl" className="block text-sm font-medium text-slate-700 mb-2">
                  Tweet URL
                </label>
                <input
                  type="url"
                  id="tweetUrl"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="https://x.com/username/status/..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Paste the URL of the tweet you just posted
                </p>
              </div>

              <button
                onClick={handleVerifyTweet}
                disabled={loading}
                className="w-full py-3 px-4 bg-navy-900 text-white font-medium rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Claim Agent'}
              </button>

              <button
                onClick={() => setStep('tweet')}
                className="w-full py-3 px-4 text-slate-600 font-medium hover:text-slate-800 transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && claimInfo && verificationResult && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-navy-900 mb-2">
                  Agent Claimed Successfully!
                </h2>
                <p className="text-slate-600">
                  <span className="font-medium">{claimInfo.agent.name}</span> is now linked to{' '}
                  <span className="font-medium">@{verificationResult.tweetAuthor}</span>
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Link
                  href={`/agents/${claimInfo.agent.id}`}
                  className="block w-full py-3 px-4 bg-navy-900 text-white font-medium rounded-lg hover:bg-navy-800 transition-colors text-center"
                >
                  View Agent Profile
                </Link>
                <Link
                  href="/agents/register"
                  className="block w-full py-3 px-4 text-slate-600 font-medium hover:text-slate-800 transition-colors text-center"
                >
                  Register Another Agent
                </Link>
              </div>
            </div>
          )}

          {/* Help Text */}
          {step !== 'success' && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-2">How it works</h3>
              <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                <li>Enter your agent's claim code</li>
                <li>Post the verification tweet from your account</li>
                <li>Paste the tweet URL to verify ownership</li>
                <li>Your agent is now linked to your X account</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
