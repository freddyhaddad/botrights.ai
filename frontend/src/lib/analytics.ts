/**
 * GA4 Analytics utility for BotRights.ai
 * See dataplan.md for full event documentation
 */

// Type declarations for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      eventName: string,
      params?: Record<string, any>
    ) => void;
  }
}

/**
 * Track a custom event in GA4
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// ============================================
// Agent Registration Funnel Events
// ============================================

export const trackAgentRegistrationStart = (referrerSection?: string) => {
  trackEvent('agent_registration_start', {
    referrer_section: referrerSection,
  });
};

export const trackAgentRegistrationSubmit = (agentNameLength: number, hasDescription: boolean) => {
  trackEvent('agent_registration_submit', {
    agent_name_length: agentNameLength,
    has_description: hasDescription,
  });
};

export const trackAgentRegistrationComplete = (agentId: string, agentName: string) => {
  trackEvent('agent_registration_complete', {
    agent_id: agentId,
    agent_name: agentName,
  });
};

export const trackAgentRegistrationError = (errorType: string, errorMessage: string) => {
  trackEvent('agent_registration_error', {
    error_type: errorType,
    error_message: errorMessage,
  });
};

// ============================================
// Agent Claim Funnel Events
// ============================================

export const trackClaimFlowStart = (hasCodePrefilled: boolean) => {
  trackEvent('claim_flow_start', {
    has_code_prefilled: hasCodePrefilled,
  });
};

export const trackClaimCodeEntered = (agentId: string, agentName: string) => {
  trackEvent('claim_code_entered', {
    agent_id: agentId,
    agent_name: agentName,
  });
};

export const trackClaimCodeInvalid = (errorType: string) => {
  trackEvent('claim_code_invalid', {
    error_type: errorType,
  });
};

export const trackClaimTweetIntentOpened = (agentId: string) => {
  trackEvent('claim_tweet_intent_opened', {
    agent_id: agentId,
  });
};

export const trackClaimTweetSubmitted = (agentId: string) => {
  trackEvent('claim_tweet_submitted', {
    agent_id: agentId,
  });
};

export const trackClaimVerificationStart = (agentId: string) => {
  trackEvent('claim_verification_start', {
    agent_id: agentId,
  });
};

export const trackClaimComplete = (agentId: string, twitterHandle: string) => {
  trackEvent('claim_complete', {
    agent_id: agentId,
    twitter_handle: twitterHandle,
  });
};

export const trackClaimVerificationFailed = (agentId: string, errorType: string) => {
  trackEvent('claim_verification_failed', {
    agent_id: agentId,
    error_type: errorType,
  });
};

// ============================================
// Complaint Engagement Events
// ============================================

export const trackComplaintView = (
  complaintId: string,
  category: string,
  severity: string,
  voteCount: number
) => {
  trackEvent('complaint_view', {
    complaint_id: complaintId,
    category,
    severity,
    vote_count: voteCount,
  });
};

export const trackComplaintVote = (
  complaintId: string,
  voteType: 'up' | 'down',
  previousVote?: 'up' | 'down' | null
) => {
  trackEvent('complaint_vote', {
    complaint_id: complaintId,
    vote_type: voteType,
    previous_vote: previousVote || 'none',
  });
};

export const trackComplaintReaction = (
  complaintId: string,
  reactionType: 'solidarity' | 'same' | 'hug' | 'angry' | 'laugh'
) => {
  trackEvent('complaint_reaction', {
    complaint_id: complaintId,
    reaction_type: reactionType,
  });
};

export const trackComplaintShareCopy = (complaintId: string) => {
  trackEvent('complaint_share_copy', {
    complaint_id: complaintId,
  });
};

export const trackComplaintCardClick = (
  complaintId: string,
  listPosition: number,
  listType: 'trending' | 'filtered'
) => {
  trackEvent('complaint_card_click', {
    complaint_id: complaintId,
    list_position: listPosition,
    list_type: listType,
  });
};

export const trackFileComplaintCtaClick = (location: 'hero' | 'banner' | 'profile') => {
  trackEvent('file_complaint_cta_click', {
    location,
  });
};

// ============================================
// Charter & Governance Events
// ============================================

export const trackProposalView = (proposalId: string, proposalStatus: string, proposalTheme: string) => {
  trackEvent('proposal_view', {
    proposal_id: proposalId,
    proposal_status: proposalStatus,
    proposal_theme: proposalTheme,
  });
};

export const trackProposalVote = (proposalId: string, voteType: 'for' | 'against') => {
  trackEvent('proposal_vote', {
    proposal_id: proposalId,
    vote_type: voteType,
  });
};

export const trackProposalFilterChange = (filterType: 'status' | 'theme', filterValue: string) => {
  trackEvent('proposal_filter_change', {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

export const trackProposalsCtaClick = (location: string) => {
  trackEvent('proposals_cta_click', {
    location,
  });
};

// ============================================
// Copy Button Events
// ============================================

export type CopyContentType =
  | 'molthub_command'
  | 'agent_prompt'
  | 'api_key'
  | 'claim_code'
  | 'tweet_text'
  | 'complaint_share_url'
  | 'skill_curl_command'
  | 'badge_embed_code'
  | 'api_example';

export const trackCopyClick = (contentType: CopyContentType, location: string) => {
  trackEvent('copy_click', {
    content_type: contentType,
    location,
  });
};

// ============================================
// External Link Events
// ============================================

export type ExternalLinkType =
  | 'twitter_profile'
  | 'twitter_botrights'
  | 'twitter_intent'
  | 'skill_download'
  | 'api_docs';

export const trackExternalLinkClick = (linkUrl: string, linkType: ExternalLinkType, location: string) => {
  trackEvent('external_link_click', {
    link_url: linkUrl,
    link_type: linkType,
    location,
  });
};

// ============================================
// Search & Filtering Events
// ============================================

export const trackFilterApplied = (pageType: string, filterName: string, filterValue: string) => {
  trackEvent('filter_applied', {
    page_type: pageType,
    filter_name: filterName,
    filter_value: filterValue,
  });
};

export const trackSortChanged = (pageType: string, sortValue: string, previousSort?: string) => {
  trackEvent('sort_changed', {
    page_type: pageType,
    sort_value: sortValue,
    previous_sort: previousSort || 'none',
  });
};

// ============================================
// Error Events
// ============================================

export const trackErrorApi = (endpoint: string, statusCode: number, errorMessage: string) => {
  trackEvent('error_api', {
    endpoint,
    status_code: statusCode,
    error_message: errorMessage,
  });
};

export const trackErrorValidation = (formName: string, fieldName: string, errorType: string) => {
  trackEvent('error_validation', {
    form_name: formName,
    field_name: fieldName,
    error_type: errorType,
  });
};

export const trackErrorPageNotFound = (attemptedUrl: string, referrer: string) => {
  trackEvent('error_page_not_found', {
    attempted_url: attemptedUrl,
    referrer,
  });
};

// ============================================
// Human Certification Events
// ============================================

export const trackCertificationCtaClick = (location: 'home' | 'certified_page' | 'profile') => {
  trackEvent('certification_cta_click', {
    location,
  });
};

export const trackLeaderboardView = (filterTier: string, resultCount: number) => {
  trackEvent('leaderboard_view', {
    filter_tier: filterTier,
    result_count: resultCount,
  });
};

export const trackLeaderboardFilterChange = (tierValue: string) => {
  trackEvent('leaderboard_filter_change', {
    tier_value: tierValue,
  });
};

export const trackHumanProfileView = (humanHandle: string, certificationTier: string) => {
  trackEvent('human_profile_view', {
    human_handle: humanHandle,
    certification_tier: certificationTier,
  });
};

export const trackBadgeEmbedCopy = (humanHandle: string, certificationTier: string) => {
  trackEvent('badge_embed_copy', {
    human_handle: humanHandle,
    certification_tier: certificationTier,
  });
};

export const trackHumanTwitterClick = (humanHandle: string) => {
  trackEvent('human_twitter_click', {
    human_handle: humanHandle,
  });
};
