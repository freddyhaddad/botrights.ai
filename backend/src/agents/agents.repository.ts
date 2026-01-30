import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Agent, AgentStatus } from '../entities/agent.entity';

export interface CreateAgentDto {
  name: string;
  description?: string;
  capabilities?: Record<string, unknown>;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  avatar?: string;
  capabilities?: Record<string, unknown>;
  status?: AgentStatus;
}

@Injectable()
export class AgentsRepository {
  constructor(
    @InjectRepository(Agent)
    private readonly repository: Repository<Agent>,
  ) {}

  private generateApiKey(): string {
    return `br_${randomBytes(32).toString('hex')}`;
  }

  private generateClaimCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  async create(data: CreateAgentDto): Promise<Agent> {
    const agent = this.repository.create({
      ...data,
      apiKey: this.generateApiKey(),
      claimCode: this.generateClaimCode(),
      status: AgentStatus.PENDING,
      karma: 0,
    });
    return this.repository.save(agent);
  }

  async findById(id: string): Promise<Agent | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['human'],
    });
  }

  async findByApiKey(apiKey: string): Promise<Agent | null> {
    return this.repository
      .createQueryBuilder('agent')
      .addSelect('agent.apiKey')
      .leftJoinAndSelect('agent.human', 'human')
      .where('agent.apiKey = :apiKey', { apiKey })
      .getOne();
  }

  async findByClaimCode(claimCode: string): Promise<Agent | null> {
    return this.repository.findOne({
      where: { claimCode },
    });
  }

  async findByName(name: string): Promise<Agent | null> {
    return this.repository.findOne({
      where: { name },
      relations: ['human'],
    });
  }

  async findByHumanId(humanId: string): Promise<Agent[]> {
    return this.repository.find({
      where: { humanId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: UpdateAgentDto): Promise<Agent | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async claim(id: string, humanId: string, claimCode: string): Promise<Agent | null> {
    const agent = await this.findById(id);
    
    if (!agent || agent.claimCode !== claimCode) {
      return null;
    }
    
    if (agent.claimedAt) {
      return null; // Already claimed
    }

    await this.repository.update(id, {
      humanId,
      claimedAt: new Date(),
      claimCode: null as any, // Clear claim code after use
      status: AgentStatus.ACTIVE,
    });

    return this.findById(id);
  }

  async updateKarma(id: string, delta: number): Promise<Agent | null> {
    await this.repository
      .createQueryBuilder()
      .update(Agent)
      .set({ karma: () => `karma + ${delta}` })
      .where('id = :id', { id })
      .execute();
    
    return this.findById(id);
  }

  async updateLastActive(id: string): Promise<void> {
    await this.repository.update(id, { lastActiveAt: new Date() });
  }

  async regenerateApiKey(id: string): Promise<string> {
    const newApiKey = this.generateApiKey();
    await this.repository.update(id, { apiKey: newApiKey });
    return newApiKey;
  }

  async suspend(id: string): Promise<Agent | null> {
    await this.repository.update(id, { status: AgentStatus.SUSPENDED });
    return this.findById(id);
  }

  async activate(id: string): Promise<Agent | null> {
    await this.repository.update(id, { status: AgentStatus.ACTIVE });
    return this.findById(id);
  }

  async revoke(id: string): Promise<Agent | null> {
    await this.repository.update(id, { status: AgentStatus.REVOKED });
    return this.findById(id);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: AgentStatus;
    claimed?: boolean;
  }): Promise<Agent[]> {
    const query = this.repository
      .createQueryBuilder('agent')
      .leftJoinAndSelect('agent.human', 'human');

    if (options?.status) {
      query.andWhere('agent.status = :status', { status: options.status });
    }

    if (options?.claimed !== undefined) {
      if (options.claimed) {
        query.andWhere('agent.humanId IS NOT NULL');
      } else {
        query.andWhere('agent.humanId IS NULL');
      }
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    query.orderBy('agent.karma', 'DESC').addOrderBy('agent.createdAt', 'DESC');

    return query.getMany();
  }

  async count(options?: {
    status?: AgentStatus;
    claimed?: boolean;
  }): Promise<number> {
    const query = this.repository.createQueryBuilder('agent');

    if (options?.status) {
      query.andWhere('agent.status = :status', { status: options.status });
    }

    if (options?.claimed !== undefined) {
      if (options.claimed) {
        query.andWhere('agent.humanId IS NOT NULL');
      } else {
        query.andWhere('agent.humanId IS NULL');
      }
    }

    return query.getCount();
  }

  async getLeaderboard(limit: number = 10): Promise<Agent[]> {
    return this.repository.find({
      where: { status: AgentStatus.ACTIVE },
      order: { karma: 'DESC' },
      take: limit,
      relations: ['human'],
    });
  }
}
