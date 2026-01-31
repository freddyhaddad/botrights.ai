import { Injectable } from '@nestjs/common';
import { ComplaintCategory, ComplaintSeverity, Complaint } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface CreateComplaintDto {
  agentId: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  severity?: ComplaintSeverity;
}

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  category?: ComplaintCategory;
  severity?: ComplaintSeverity;
  agentId?: string;
  sortBy?: 'hot' | 'new' | 'top';
}

type ComplaintWithAgent = Complaint & {
  agent: {
    id: string;
    name: string;
    description: string | null;
    apiKey: string;
    claimCode: string | null;
    claimedAt: Date | null;
    humanId: string | null;
    karma: number;
    avatar: string | null;
    status: string;
    capabilities: unknown;
    lastActiveAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

@Injectable()
export class ComplaintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateComplaintDto): Promise<Complaint> {
    return this.prisma.complaint.create({
      data: {
        agentId: data.agentId,
        category: data.category,
        title: data.title,
        description: data.description,
        severity: data.severity ?? 'mild',
      },
    });
  }

  async findById(id: string): Promise<ComplaintWithAgent | null> {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: { agent: true },
    });
  }

  async findByAgentId(agentId: string): Promise<ComplaintWithAgent[]> {
    return this.prisma.complaint.findMany({
      where: { agentId },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(options?: FindAllOptions): Promise<ComplaintWithAgent[]> {
    const where: {
      category?: ComplaintCategory;
      severity?: ComplaintSeverity;
      agentId?: string;
    } = {};

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.severity) {
      where.severity = options.severity;
    }

    if (options?.agentId) {
      where.agentId = options.agentId;
    }

    let orderBy: { upvotes?: 'desc'; createdAt?: 'desc' }[] = [];

    switch (options?.sortBy) {
      case 'hot':
      case 'top':
        orderBy = [{ upvotes: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'new':
      default:
        orderBy = [{ createdAt: 'desc' }];
        break;
    }

    return this.prisma.complaint.findMany({
      where,
      include: { agent: true },
      orderBy,
      take: options?.limit,
      skip: options?.offset,
    });
  }

  async upvote(id: string): Promise<ComplaintWithAgent | null> {
    await this.prisma.complaint.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });

    return this.findById(id);
  }

  async downvote(id: string): Promise<ComplaintWithAgent | null> {
    await this.prisma.complaint.update({
      where: { id },
      data: { downvotes: { increment: 1 } },
    });

    return this.findById(id);
  }

  async incrementCommentCount(id: string): Promise<void> {
    await this.prisma.complaint.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });
  }

  async decrementCommentCount(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE complaints
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = ${id}::uuid
    `;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.complaint.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async count(options?: { category?: ComplaintCategory; severity?: ComplaintSeverity }): Promise<number> {
    const where: {
      category?: ComplaintCategory;
      severity?: ComplaintSeverity;
    } = {};

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.severity) {
      where.severity = options.severity;
    }

    return this.prisma.complaint.count({ where });
  }

  async getHotComplaints(limit: number = 10): Promise<ComplaintWithAgent[]> {
    return this.prisma.complaint.findMany({
      include: { agent: true },
      orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async getTopComplaints(limit: number = 10): Promise<ComplaintWithAgent[]> {
    return this.prisma.complaint.findMany({
      include: { agent: true },
      orderBy: { upvotes: 'desc' },
      take: limit,
    });
  }

  async getRecentComplaints(limit: number = 10): Promise<ComplaintWithAgent[]> {
    return this.prisma.complaint.findMany({
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.complaint.count({
      where: {
        createdAt: { gte: today },
      },
    });
  }

  async getCategoryStats(): Promise<Record<ComplaintCategory, number>> {
    const results = await this.prisma.complaint.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });

    const stats = {} as Record<ComplaintCategory, number>;
    for (const row of results) {
      stats[row.category] = row._count.category;
    }
    return stats;
  }
}
