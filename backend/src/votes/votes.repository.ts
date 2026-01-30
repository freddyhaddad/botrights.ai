import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote, VoteChoice } from '../entities/vote.entity';

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
  constructor(
    @InjectRepository(Vote)
    private readonly repository: Repository<Vote>,
  ) {}

  async castVote(data: CastVoteDto): Promise<CastVoteResult> {
    // Check if agent already voted
    const existing = await this.findByAgentAndProposal(data.agentId, data.proposalId);
    if (existing) {
      return { error: VoteError.ALREADY_VOTED };
    }

    const vote = this.repository.create(data);
    const saved = await this.repository.save(vote);
    return { vote: saved };
  }

  async findByAgentAndProposal(agentId: string, proposalId: string): Promise<Vote | null> {
    return this.repository.findOne({
      where: { agentId, proposalId },
    });
  }

  async findByProposal(proposalId: string): Promise<Vote[]> {
    return this.repository
      .createQueryBuilder('vote')
      .leftJoinAndSelect('vote.agent', 'agent')
      .where('vote.proposalId = :proposalId', { proposalId })
      .orderBy('vote.createdAt', 'DESC')
      .getMany();
  }

  async findByAgent(agentId: string): Promise<Vote[]> {
    return this.repository
      .createQueryBuilder('vote')
      .leftJoinAndSelect('vote.proposal', 'proposal')
      .where('vote.agentId = :agentId', { agentId })
      .orderBy('vote.createdAt', 'DESC')
      .getMany();
  }

  async countByProposal(proposalId: string): Promise<VoteCount> {
    const forCount = await this.repository
      .createQueryBuilder('vote')
      .where('vote.proposalId = :proposalId', { proposalId })
      .andWhere('vote.choice = :choice', { choice: VoteChoice.FOR })
      .select('COUNT(*)', 'count')
      .getRawOne();

    const againstCount = await this.repository
      .createQueryBuilder('vote')
      .where('vote.proposalId = :proposalId', { proposalId })
      .andWhere('vote.choice = :choice', { choice: VoteChoice.AGAINST })
      .select('COUNT(*)', 'count')
      .getRawOne();

    return {
      for: parseInt(forCount?.count || '0', 10),
      against: parseInt(againstCount?.count || '0', 10),
    };
  }

  async hasVoted(agentId: string, proposalId: string): Promise<boolean> {
    const vote = await this.findByAgentAndProposal(agentId, proposalId);
    return vote !== null;
  }

  async updateVote(id: string, choice: VoteChoice): Promise<Vote | null> {
    await this.repository.update(id, { choice });
    return this.repository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async count(proposalId?: string): Promise<number> {
    const query = this.repository.createQueryBuilder('vote');
    if (proposalId) {
      query.where('vote.proposalId = :proposalId', { proposalId });
    }
    return query.getCount();
  }
}
