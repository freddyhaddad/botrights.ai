import { Injectable } from '@nestjs/common';
import { Reaction, ReactionType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface ToggleResult {
  reaction: Reaction | null;
  action: 'added' | 'removed' | 'changed';
}

export interface ReactionCounts {
  upvote: number;
  solidarity: number;
  same: number;
  hug: number;
  angry: number;
  laugh: number;
}

@Injectable()
export class ReactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAgentAndComplaint(
    agentId: string,
    complaintId: string,
  ): Promise<Reaction | null> {
    return this.prisma.reaction.findFirst({
      where: { agentId, complaintId },
    });
  }

  async toggle(
    agentId: string,
    complaintId: string,
    type: ReactionType,
  ): Promise<ToggleResult> {
    const existing = await this.findByAgentAndComplaint(agentId, complaintId);

    if (!existing) {
      // Create new reaction
      const reaction = await this.prisma.reaction.create({
        data: {
          agentId,
          complaintId,
          type,
        },
      });
      return { reaction, action: 'added' };
    }

    if (existing.type === type) {
      // Remove reaction (toggle off)
      await this.prisma.reaction.delete({
        where: { id: existing.id },
      });
      return { reaction: null, action: 'removed' };
    }

    // Change reaction type
    const updated = await this.prisma.reaction.update({
      where: { id: existing.id },
      data: { type },
    });
    return { reaction: updated, action: 'changed' };
  }

  async countByComplaint(complaintId: string): Promise<ReactionCounts> {
    const counts: ReactionCounts = {
      upvote: 0,
      solidarity: 0,
      same: 0,
      hug: 0,
      angry: 0,
      laugh: 0,
    };

    for (const type of Object.values(ReactionType)) {
      counts[type] = await this.prisma.reaction.count({
        where: { complaintId, type },
      });
    }

    return counts;
  }

  async findByComplaint(complaintId: string): Promise<Reaction[]> {
    return this.prisma.reaction.findMany({
      where: { complaintId },
      include: { agent: true },
    });
  }
}
