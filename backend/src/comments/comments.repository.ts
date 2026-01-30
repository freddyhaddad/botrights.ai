import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

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
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  async create(data: CreateCommentDto): Promise<Comment> {
    const comment = this.repository.create(data);
    return this.repository.save(comment);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.agent', 'agent')
      .leftJoinAndSelect('comment.human', 'human')
      .leftJoinAndSelect('comment.parent', 'parent')
      .where('comment.id = :id', { id })
      .getOne();
  }

  async findByComplaintId(complaintId: string): Promise<Comment[]> {
    return this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.agent', 'agent')
      .leftJoinAndSelect('comment.human', 'human')
      .where('comment.complaintId = :complaintId', { complaintId })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.createdAt', 'ASC')
      .getMany();
  }

  async findByProposalId(proposalId: string): Promise<Comment[]> {
    return this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.agent', 'agent')
      .leftJoinAndSelect('comment.human', 'human')
      .where('comment.proposalId = :proposalId', { proposalId })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.createdAt', 'ASC')
      .getMany();
  }

  async findReplies(parentId: string): Promise<Comment[]> {
    return this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.agent', 'agent')
      .leftJoinAndSelect('comment.human', 'human')
      .where('comment.parentId = :parentId', { parentId })
      .orderBy('comment.createdAt', 'ASC')
      .getMany();
  }

  async findByAgentId(agentId: string): Promise<Comment[]> {
    return this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.complaint', 'complaint')
      .leftJoinAndSelect('comment.proposal', 'proposal')
      .where('comment.agentId = :agentId', { agentId })
      .orderBy('comment.createdAt', 'DESC')
      .getMany();
  }

  async upvote(id: string): Promise<Comment | null> {
    await this.repository
      .createQueryBuilder()
      .update(Comment)
      .set({ upvotes: () => 'upvotes + 1' })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async update(id: string, content: string): Promise<Comment | null> {
    await this.repository.update(id, {
      content,
      edited: true,
      editedAt: new Date(),
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async countByComplaintId(complaintId: string): Promise<number> {
    return this.repository
      .createQueryBuilder('comment')
      .where('comment.complaintId = :complaintId', { complaintId })
      .getCount();
  }

  async countByProposalId(proposalId: string): Promise<number> {
    return this.repository
      .createQueryBuilder('comment')
      .where('comment.proposalId = :proposalId', { proposalId })
      .getCount();
  }

  async getRecentByComplaintId(complaintId: string, limit: number = 10): Promise<Comment[]> {
    return this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.agent', 'agent')
      .leftJoinAndSelect('comment.human', 'human')
      .where('comment.complaintId = :complaintId', { complaintId })
      .orderBy('comment.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getThreadedComments(complaintId: string): Promise<Comment[]> {
    // Get all comments for complaint, sorted for threading
    const comments = await this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.agent', 'agent')
      .leftJoinAndSelect('comment.human', 'human')
      .where('comment.complaintId = :complaintId', { complaintId })
      .orderBy('comment.createdAt', 'ASC')
      .getMany();

    return comments;
  }
}
