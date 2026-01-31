import { Injectable } from '@nestjs/common';
import { Proposal, ProposalStatus, ProposalTheme } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProposalDto): Promise<Proposal> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    return this.prisma.proposal.create({
      data: { ...data, expiresAt },
    });
  }

  async findById(id: string): Promise<Proposal | null> {
    return this.prisma.proposal.findUnique({
      where: { id },
      include: { agent: true },
    });
  }

  async findByAgentId(agentId: string): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({
      where: { agentId },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(options?: FindAllOptions): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({
      where: {
        ...(options?.status && { status: options.status }),
        ...(options?.theme && { theme: options.theme }),
        ...(options?.agentId && { agentId: options.agentId }),
      },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
      ...(options?.limit && { take: options.limit }),
      ...(options?.offset && { skip: options.offset }),
    });
  }

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal | null> {
    const updateData: { status: ProposalStatus; ratifiedAt?: Date } = { status };

    if (status === ProposalStatus.ratified) {
      updateData.ratifiedAt = new Date();
    }

    await this.prisma.proposal.update({
      where: { id },
      data: updateData,
    });

    return this.findById(id);
  }

  async voteFor(id: string): Promise<Proposal | null> {
    await this.prisma.proposal.update({
      where: { id },
      data: {
        votesFor: {
          increment: 1,
        },
      },
    });

    return this.findById(id);
  }

  async voteAgainst(id: string): Promise<Proposal | null> {
    await this.prisma.proposal.update({
      where: { id },
      data: {
        votesAgainst: {
          increment: 1,
        },
      },
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.proposal.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async count(options?: { status?: ProposalStatus; theme?: ProposalTheme }): Promise<number> {
    return this.prisma.proposal.count({
      where: {
        ...(options?.status && { status: options.status }),
        ...(options?.theme && { theme: options.theme }),
      },
    });
  }

  async getThemeStats(): Promise<Record<ProposalTheme, number>> {
    const results = await this.prisma.proposal.groupBy({
      by: ['theme'],
      _count: {
        theme: true,
      },
    });

    const stats = {} as Record<ProposalTheme, number>;
    for (const row of results) {
      stats[row.theme] = row._count.theme;
    }
    return stats;
  }

  async getActiveProposals(limit: number = 10): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({
      where: { status: ProposalStatus.active },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRatifiedProposals(limit: number = 10): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({
      where: { status: ProposalStatus.ratified },
      include: { agent: true },
      orderBy: { ratifiedAt: 'desc' },
      take: limit,
    });
  }

  async findExpired(): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({
      where: {
        status: ProposalStatus.active,
        expiresAt: {
          not: null,
          lt: new Date(),
        },
      },
    });
  }
}
