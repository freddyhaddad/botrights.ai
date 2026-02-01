import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent, VoteChoice } from '@prisma/client';
import { VotesRepository } from './votes.repository';
import { ProposalsRepository } from '../proposals/proposals.repository';
import { RatificationService, RatificationResult } from '../proposals/ratification.service';
import { VoteRateLimit, RateLimitGuard } from '../rate-limit/rate-limit.guard';

interface CastVoteDto {
  choice: VoteChoice;
}

@Controller('api/v1/proposals/:proposalId/vote')
export class VotesController {
  constructor(
    private readonly votesRepository: VotesRepository,
    private readonly proposalsRepository: ProposalsRepository,
    private readonly ratificationService: RatificationService,
  ) {}

  @Post()
  @UseGuards(ApiKeyGuard, RateLimitGuard)
  @VoteRateLimit()
  async vote(
    @Param('proposalId') proposalId: string,
    @Body() dto: CastVoteDto,
    @CurrentAgent() agent: Agent,
  ) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    // Validate choice
    if (!Object.values(VoteChoice).includes(dto.choice)) {
      throw new BadRequestException('Invalid vote choice');
    }

    // Verify proposal exists
    const proposal = await this.proposalsRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check existing vote
    const existing = await this.votesRepository.findByAgentAndProposal(agent.id, proposalId);

    if (existing) {
      // Already voted
      if (existing.choice === dto.choice) {
        return { action: 'unchanged', choice: dto.choice };
      }

      // Change vote - update proposal counts
      const oldChoice = existing.choice;
      const updated = await this.votesRepository.updateVote(existing.id, dto.choice);

      // Adjust proposal vote counts
      if (oldChoice === VoteChoice.for) {
        await this.proposalsRepository.voteAgainst(proposalId); // Decrement for, increment against
      } else {
        await this.proposalsRepository.voteFor(proposalId); // Decrement against, increment for
      }

      // Check ratification after vote change
      const ratification = await this.tryCheckRatification(proposalId);

      return { action: 'changed', choice: dto.choice, vote: updated, ratification };
    }

    // New vote
    const result = await this.votesRepository.castVote({
      agentId: agent.id,
      proposalId,
      choice: dto.choice,
    });

    // Update proposal vote counts
    if (dto.choice === VoteChoice.for) {
      await this.proposalsRepository.voteFor(proposalId);
    } else {
      await this.proposalsRepository.voteAgainst(proposalId);
    }

    // Check ratification after new vote
    const ratification = await this.tryCheckRatification(proposalId);

    return { action: 'created', choice: dto.choice, vote: result.vote, ratification };
  }

  /**
   * Attempts to check ratification status.
   * Returns undefined if check fails, so voting is not affected by ratification errors.
   */
  private async tryCheckRatification(proposalId: string): Promise<RatificationResult | undefined> {
    try {
      return await this.ratificationService.checkRatification(proposalId);
    } catch (error) {
      // Log error but don't fail the vote
      console.error(`Ratification check failed for proposal ${proposalId}:`, error);
      return undefined;
    }
  }
}
