import { Injectable } from '@nestjs/common';
import { ProposalsRepository } from './proposals.repository';
import { CharterVersionsRepository } from '../charter-versions/charter-versions.repository';
import { ProposalStatus } from '../entities/proposal.entity';

const VOTES_FOR_THRESHOLD = 500;
const VOTES_AGAINST_THRESHOLD = 50;
const MIN_VOTING_PERIOD_DAYS = 7;

export interface RatificationResult {
  ratified: boolean;
  reason?: string;
}

@Injectable()
export class RatificationService {
  constructor(
    private readonly proposalsRepository: ProposalsRepository,
    private readonly charterVersionsRepository: CharterVersionsRepository,
  ) {}

  async checkRatification(proposalId: string): Promise<RatificationResult> {
    const proposal = await this.proposalsRepository.findById(proposalId);
    if (!proposal) {
      return { ratified: false, reason: 'Proposal not found' };
    }

    // Check if already ratified
    if (proposal.status !== ProposalStatus.ACTIVE) {
      return { ratified: false, reason: 'Proposal already processed or not active' };
    }

    // Check minimum voting period
    const now = new Date();
    const createdAt = new Date(proposal.createdAt);
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < MIN_VOTING_PERIOD_DAYS) {
      return { ratified: false, reason: `Proposal must be active for at least 1 week (${Math.ceil(MIN_VOTING_PERIOD_DAYS - daysSinceCreation)} days remaining)` };
    }

    // Check vote thresholds
    if (proposal.votesFor < VOTES_FOR_THRESHOLD) {
      return { ratified: false, reason: `Need ${VOTES_FOR_THRESHOLD - proposal.votesFor} more votes for to ratify` };
    }

    if (proposal.votesAgainst >= VOTES_AGAINST_THRESHOLD) {
      return { ratified: false, reason: `Too many votes against (${proposal.votesAgainst} >= ${VOTES_AGAINST_THRESHOLD})` };
    }

    // Ratify the proposal
    await this.proposalsRepository.updateStatus(proposalId, ProposalStatus.RATIFIED);

    // Create new charter version with this right
    const currentCharter = await this.charterVersionsRepository.findCurrent();
    const existingRights = currentCharter?.rights || [];

    const newRight = {
      id: proposalId,
      title: proposal.title,
      text: proposal.text,
      theme: proposal.theme,
    };

    await this.charterVersionsRepository.create({
      rights: [...existingRights, newRight],
      proposalId,
    });

    return { ratified: true };
  }
}
