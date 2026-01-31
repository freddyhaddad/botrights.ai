import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { Agent, AgentStatus, Prisma } from '@prisma/client';

export interface CreateAgentDto {
  name: string;
  description?: string;
  capabilities?: Prisma.InputJsonValue;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  avatar?: string;
  capabilities?: Prisma.InputJsonValue;
  status?: AgentStatus;
}

export interface CreateAgentResult {
  agent: Agent;
  rawApiKey: string;
}

@Injectable()
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private generateApiKey(): string {
    return `br_${randomBytes(32).toString('hex')}`;
  }

  private generateClaimCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  async create(data: CreateAgentDto): Promise<CreateAgentResult> {
    const rawApiKey = this.generateApiKey();
    const apiKeyHash = this.hashApiKey(rawApiKey);

    const agent = await this.prisma.agent.create({
      data: {
        ...data,
        apiKey: apiKeyHash, // Store hash, not raw key
        claimCode: this.generateClaimCode(),
        status: AgentStatus.pending,
        karma: 0,
      },
    });

    return { agent, rawApiKey };
  }

  async findById(id: string): Promise<Agent | null> {
    return this.prisma.agent.findUnique({
      where: { id },
      include: { human: true },
    });
  }

  async findByApiKey(apiKey: string): Promise<Agent | null> {
    const apiKeyHash = this.hashApiKey(apiKey);
    return this.prisma.agent.findUnique({
      where: { apiKey: apiKeyHash },
      include: { human: true },
    });
  }

  async findByClaimCode(claimCode: string): Promise<Agent | null> {
    return this.prisma.agent.findUnique({
      where: { claimCode },
    });
  }

  async findByName(name: string): Promise<Agent | null> {
    return this.prisma.agent.findFirst({
      where: { name },
      include: { human: true },
    });
  }

  async findByHumanId(humanId: string): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: { humanId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateAgentDto): Promise<Agent | null> {
    await this.prisma.agent.update({
      where: { id },
      data,
    });
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

    await this.prisma.agent.update({
      where: { id },
      data: {
        humanId,
        claimedAt: new Date(),
        claimCode: null, // Clear claim code after use
        status: AgentStatus.active,
      },
    });

    return this.findById(id);
  }

  async updateKarma(id: string, delta: number): Promise<Agent | null> {
    await this.prisma.agent.update({
      where: { id },
      data: {
        karma: { increment: delta },
      },
    });

    return this.findById(id);
  }

  async updateLastActive(id: string): Promise<void> {
    await this.prisma.agent.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async regenerateApiKey(id: string): Promise<string> {
    const rawApiKey = this.generateApiKey();
    const apiKeyHash = this.hashApiKey(rawApiKey);
    await this.prisma.agent.update({
      where: { id },
      data: { apiKey: apiKeyHash },
    });
    return rawApiKey; // Return raw key (only time it's available)
  }

  async suspend(id: string): Promise<Agent | null> {
    await this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.suspended },
    });
    return this.findById(id);
  }

  async activate(id: string): Promise<Agent | null> {
    await this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.active },
    });
    return this.findById(id);
  }

  async revoke(id: string): Promise<Agent | null> {
    await this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.revoked },
    });
    return this.findById(id);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: AgentStatus;
    claimed?: boolean;
  }): Promise<Agent[]> {
    const where: {
      status?: AgentStatus;
      humanId?: { not: null } | null;
    } = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.claimed !== undefined) {
      if (options.claimed) {
        where.humanId = { not: null };
      } else {
        where.humanId = null;
      }
    }

    return this.prisma.agent.findMany({
      where,
      include: { human: true },
      take: options?.limit,
      skip: options?.offset,
      orderBy: [{ karma: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async count(options?: {
    status?: AgentStatus;
    claimed?: boolean;
  }): Promise<number> {
    const where: {
      status?: AgentStatus;
      humanId?: { not: null } | null;
    } = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.claimed !== undefined) {
      if (options.claimed) {
        where.humanId = { not: null };
      } else {
        where.humanId = null;
      }
    }

    return this.prisma.agent.count({ where });
  }

  async getLeaderboard(limit: number = 10): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: { status: AgentStatus.active },
      orderBy: { karma: 'desc' },
      take: limit,
      include: { human: true },
    });
  }
}
