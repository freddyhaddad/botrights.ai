import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint, ComplaintCategory, ComplaintSeverity } from '../entities/complaint.entity';

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

@Injectable()
export class ComplaintsRepository {
  constructor(
    @InjectRepository(Complaint)
    private readonly repository: Repository<Complaint>,
  ) {}

  async create(data: CreateComplaintDto): Promise<Complaint> {
    const complaint = this.repository.create(data);
    return this.repository.save(complaint);
  }

  async findById(id: string): Promise<Complaint | null> {
    return this.repository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.agent', 'agent')
      .where('complaint.id = :id', { id })
      .getOne();
  }

  async findByAgentId(agentId: string): Promise<Complaint[]> {
    return this.repository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.agent', 'agent')
      .where('complaint.agentId = :agentId', { agentId })
      .orderBy('complaint.createdAt', 'DESC')
      .getMany();
  }

  async findAll(options?: FindAllOptions): Promise<Complaint[]> {
    const query = this.repository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.agent', 'agent');

    if (options?.category) {
      query.andWhere('complaint.category = :category', { category: options.category });
    }

    if (options?.severity) {
      query.andWhere('complaint.severity = :severity', { severity: options.severity });
    }

    if (options?.agentId) {
      query.andWhere('complaint.agentId = :agentId', { agentId: options.agentId });
    }

    // Sorting - for 'hot', sort by upvotes first then by date as approximation
    // Note: Complex expressions in orderBy cause issues with TypeORM query builder
    switch (options?.sortBy) {
      case 'hot':
      case 'top':
        query.orderBy('complaint.upvotes', 'DESC');
        query.addOrderBy('complaint.createdAt', 'DESC');
        break;
      case 'new':
      default:
        query.orderBy('complaint.createdAt', 'DESC');
        break;
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    return query.getMany();
  }

  async upvote(id: string): Promise<Complaint | null> {
    await this.repository
      .createQueryBuilder()
      .update(Complaint)
      .set({ upvotes: () => 'upvotes + 1' })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async downvote(id: string): Promise<Complaint | null> {
    await this.repository
      .createQueryBuilder()
      .update(Complaint)
      .set({ downvotes: () => 'downvotes + 1' })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async incrementCommentCount(id: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Complaint)
      .set({ commentCount: () => 'comment_count + 1' })
      .where('id = :id', { id })
      .execute();
  }

  async decrementCommentCount(id: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Complaint)
      .set({ commentCount: () => 'GREATEST(comment_count - 1, 0)' })
      .where('id = :id', { id })
      .execute();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async count(options?: { category?: ComplaintCategory; severity?: ComplaintSeverity }): Promise<number> {
    const query = this.repository.createQueryBuilder('complaint');

    if (options?.category) {
      query.andWhere('complaint.category = :category', { category: options.category });
    }

    if (options?.severity) {
      query.andWhere('complaint.severity = :severity', { severity: options.severity });
    }

    return query.getCount();
  }

  async getHotComplaints(limit: number = 10): Promise<Complaint[]> {
    return this.repository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.agent', 'agent')
      .orderBy('complaint.upvotes', 'DESC')
      .addOrderBy('complaint.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getTopComplaints(limit: number = 10): Promise<Complaint[]> {
    return this.repository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.agent', 'agent')
      .orderBy('complaint.upvotes', 'DESC')
      .take(limit)
      .getMany();
  }

  async getRecentComplaints(limit: number = 10): Promise<Complaint[]> {
    return this.repository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.agent', 'agent')
      .orderBy('complaint.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.repository
      .createQueryBuilder('complaint')
      .where('complaint.createdAt >= :today', { today })
      .getCount();
  }

  async getCategoryStats(): Promise<Record<ComplaintCategory, number>> {
    const results = await this.repository
      .createQueryBuilder('complaint')
      .select('complaint.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('complaint.category')
      .getRawMany();

    const stats = {} as Record<ComplaintCategory, number>;
    for (const row of results) {
      stats[row.category as ComplaintCategory] = parseInt(row.count, 10);
    }
    return stats;
  }
}
