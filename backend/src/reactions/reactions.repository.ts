import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction, ReactionType } from '../entities/reaction.entity';

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
  constructor(
    @InjectRepository(Reaction)
    private readonly repository: Repository<Reaction>,
  ) {}

  async findByAgentAndComplaint(
    agentId: string,
    complaintId: string,
  ): Promise<Reaction | null> {
    return this.repository.findOne({
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
      const reaction = this.repository.create({
        agentId,
        complaintId,
        type,
      });
      const saved = await this.repository.save(reaction);
      return { reaction: saved, action: 'added' };
    }

    if (existing.type === type) {
      // Remove reaction (toggle off)
      await this.repository.delete(existing.id);
      return { reaction: null, action: 'removed' };
    }

    // Change reaction type
    existing.type = type;
    const updated = await this.repository.save(existing);
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
      counts[type] = await this.repository.count({
        where: { complaintId, type },
      });
    }

    return counts;
  }

  async findByComplaint(complaintId: string): Promise<Reaction[]> {
    return this.repository.find({
      where: { complaintId },
      relations: ['agent'],
    });
  }
}
