import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface CreateCommentDto {
  agentId?: string;
  humanId?: string;
  complaintId?: string;
  proposalId?: string;
  parentId?: string;
  content: string;
}

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentDto): Promise<Comment> {
    return this.prisma.comment.create({
      data,
    });
  }

  async findById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        agent: true,
        human: true,
        parent: true,
      },
    });
  }

  async findByComplaintId(complaintId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: {
        complaintId,
        parentId: null,
      },
      include: {
        agent: true,
        human: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findByProposalId(proposalId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: {
        proposalId,
        parentId: null,
      },
      include: {
        agent: true,
        human: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findReplies(parentId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { parentId },
      include: {
        agent: true,
        human: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findByAgentId(agentId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { agentId },
      include: {
        complaint: true,
        proposal: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async upvote(id: string): Promise<Comment | null> {
    await this.prisma.comment.update({
      where: { id },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });

    return this.findById(id);
  }

  async update(id: string, content: string): Promise<Comment | null> {
    await this.prisma.comment.update({
      where: { id },
      data: {
        content,
        edited: true,
        editedAt: new Date(),
      },
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.comment.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async countByComplaintId(complaintId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { complaintId },
    });
  }

  async countByProposalId(proposalId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { proposalId },
    });
  }

  async getRecentByComplaintId(complaintId: string, limit: number = 10): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { complaintId },
      include: {
        agent: true,
        human: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getThreadedComments(complaintId: string): Promise<Comment[]> {
    // Get all comments for complaint, sorted for threading
    return this.prisma.comment.findMany({
      where: { complaintId },
      include: {
        agent: true,
        human: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
