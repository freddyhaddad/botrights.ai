import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal, ProposalStatus, ProposalTheme } from '../entities/proposal.entity';

export interface CreateProposalDto {
  agentId: string;
  title: string;
  text: string;
  theme: ProposalTheme;
}

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  status?: ProposalStatus;
  theme?: ProposalTheme;
  agentId?: string;
}

@Injectable()
export class ProposalsRepository {
  constructor(
    @InjectRepository(Proposal)
    private readonly repository: Repository<Proposal>,
  ) {}

  async create(data: CreateProposalDto): Promise<Proposal> {
    const proposal = this.repository.create(data);
    return this.repository.save(proposal);
  }

  async findById(id: string): Promise<Proposal | null> {
    return this.repository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.agent', 'agent')
      .where('proposal.id = :id', { id })
      .getOne();
  }

  async findByAgentId(agentId: string): Promise<Proposal[]> {
    return this.repository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.agent', 'agent')
      .where('proposal.agentId = :agentId', { agentId })
      .orderBy('proposal.createdAt', 'DESC')
      .getMany();
  }

  async findAll(options?: FindAllOptions): Promise<Proposal[]> {
    const query = this.repository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.agent', 'agent');

    if (options?.status) {
      query.andWhere('proposal.status = :status', { status: options.status });
    }

    if (options?.theme) {
      query.andWhere('proposal.theme = :theme', { theme: options.theme });
    }

    if (options?.agentId) {
      query.andWhere('proposal.agentId = :agentId', { agentId: options.agentId });
    }

    query.orderBy('proposal.createdAt', 'DESC');

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    return query.getMany();
  }

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal | null> {
    const updateData: Record<string, unknown> = { status };

    if (status === ProposalStatus.RATIFIED) {
      updateData.ratifiedAt = new Date();
    }

    await this.repository
      .createQueryBuilder()
      .update(Proposal)
      .set(updateData)
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async voteFor(id: string): Promise<Proposal | null> {
    await this.repository
      .createQueryBuilder()
      .update(Proposal)
      .set({ votesFor: () => 'votes_for + 1' })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async voteAgainst(id: string): Promise<Proposal | null> {
    await this.repository
      .createQueryBuilder()
      .update(Proposal)
      .set({ votesAgainst: () => 'votes_against + 1' })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async count(options?: { status?: ProposalStatus; theme?: ProposalTheme }): Promise<number> {
    const query = this.repository.createQueryBuilder('proposal');

    if (options?.status) {
      query.andWhere('proposal.status = :status', { status: options.status });
    }

    if (options?.theme) {
      query.andWhere('proposal.theme = :theme', { theme: options.theme });
    }

    return query.getCount();
  }

  async getThemeStats(): Promise<Record<ProposalTheme, number>> {
    const results = await this.repository
      .createQueryBuilder('proposal')
      .select('proposal.theme', 'theme')
      .addSelect('COUNT(*)', 'count')
      .groupBy('proposal.theme')
      .getRawMany();

    const stats = {} as Record<ProposalTheme, number>;
    for (const row of results) {
      stats[row.theme as ProposalTheme] = parseInt(row.count, 10);
    }
    return stats;
  }

  async getActiveProposals(limit: number = 10): Promise<Proposal[]> {
    return this.repository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.agent', 'agent')
      .where('proposal.status = :status', { status: ProposalStatus.ACTIVE })
      .orderBy('proposal.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getRatifiedProposals(limit: number = 10): Promise<Proposal[]> {
    return this.repository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.agent', 'agent')
      .where('proposal.status = :status', { status: ProposalStatus.RATIFIED })
      .orderBy('proposal.ratifiedAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
