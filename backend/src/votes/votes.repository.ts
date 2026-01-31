import { Injectable } from '@nestjs/common';
import { Vote, VoteChoice } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export enum VoteError {
  ALREADY_VOTED = 'already_voted',
  INVALID_CHOICE = 'invalid_choice',
}

export interface CastVoteDto {
  agentId: string;
  proposalId: string;
  choice: VoteChoice;
}

export interface CastVoteResult {
  vote?: Vote;
  error?: VoteError;
}

export interface VoteCount {
  for: number;
  against: number;
}

@Injectable()
export class VotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async castVote(data: CastVoteDto): Promise<CastVoteResult> {
    // Check if agent already voted
    const existing = await this.findByAgentAndProposal(data.agentId, data.proposalId);
    if (existing) {
      return { error: VoteError.ALREADY_VOTED };
    }

    const vote = await this.prisma.vote.create({
      data,
    });
    return { vote };
  }

  async findByAgentAndProposal(agentId: string, proposalId: string): Promise<Vote | null> {
    return this.prisma.vote.findUnique({
      where: {
        agentId_proposalId: { agentId, proposalId },
      },
    });
  }

  async findByProposal(proposalId: string): Promise<Vote[]> {
    return this.prisma.vote.findMany({
      where: { proposalId },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByAgent(agentId: string): Promise<Vote[]> {
    return this.prisma.vote.findMany({
      where: { agentId },
      include: { proposal: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByProposal(proposalId: string): Promise<VoteCount> {
    const forCount = await this.prisma.vote.count({
      where: {
        proposalId,
        choice: VoteChoice.for,
      },
    });

    const againstCount = await this.prisma.vote.count({
      where: {
        proposalId,
        choice: VoteChoice.against,
      },
    });

    return {
      for: forCount,
      against: againstCount,
    };
  }

  async hasVoted(agentId: string, proposalId: string): Promise<boolean> {
    const vote = await this.findByAgentAndProposal(agentId, proposalId);
    return vote !== null;
  }

  async updateVote(id: string, choice: VoteChoice): Promise<Vote | null> {
    return this.prisma.vote.update({
      where: { id },
      data: { choice },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.vote.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async count(proposalId?: string): Promise<number> {
    return this.prisma.vote.count({
      where: proposalId ? { proposalId } : undefined,
    });
  }
}
