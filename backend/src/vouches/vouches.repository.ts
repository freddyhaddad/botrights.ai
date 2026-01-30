import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vouch } from '../entities/vouch.entity';

export enum VouchError {
  ALREADY_VOUCHED = 'already_vouched',
  INVALID_RATING = 'invalid_rating',
  AGENT_NOT_OWNED = 'agent_not_owned',
}

export interface CreateVouchDto {
  voucherId: string;
  agentId: string;
  endorsement?: string;
  rating: number;
}

export interface CreateVouchResult {
  vouch?: Vouch;
  error?: VouchError;
}

@Injectable()
export class VouchesRepository {
  constructor(
    @InjectRepository(Vouch)
    private readonly repository: Repository<Vouch>,
  ) {}

  async create(data: CreateVouchDto): Promise<CreateVouchResult> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      return { error: VouchError.INVALID_RATING };
    }

    // Check if already vouched
    const existing = await this.findByVoucherAndAgent(data.voucherId, data.agentId);
    if (existing) {
      return { error: VouchError.ALREADY_VOUCHED };
    }

    const vouch = this.repository.create({
      voucherId: data.voucherId,
      agentId: data.agentId,
      endorsement: data.endorsement,
      rating: data.rating,
      isActive: true,
    });

    const saved = await this.repository.save(vouch);
    return { vouch: saved };
  }

  async findByVoucherAndAgent(voucherId: string, agentId: string): Promise<Vouch | null> {
    return this.repository.findOne({
      where: { voucherId, agentId },
    });
  }

  async findById(id: string): Promise<Vouch | null> {
    return this.repository
      .createQueryBuilder('vouch')
      .leftJoinAndSelect('vouch.voucher', 'voucher')
      .leftJoinAndSelect('vouch.agent', 'agent')
      .where('vouch.id = :id', { id })
      .getOne();
  }

  async findByAgent(agentId: string, includeInactive = false): Promise<Vouch[]> {
    const query = this.repository
      .createQueryBuilder('vouch')
      .leftJoinAndSelect('vouch.voucher', 'voucher')
      .where('vouch.agentId = :agentId', { agentId });

    if (!includeInactive) {
      query.andWhere('vouch.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('vouch.createdAt', 'DESC').getMany();
  }

  async findByVoucher(voucherId: string, includeInactive = false): Promise<Vouch[]> {
    const query = this.repository
      .createQueryBuilder('vouch')
      .leftJoinAndSelect('vouch.agent', 'agent')
      .where('vouch.voucherId = :voucherId', { voucherId });

    if (!includeInactive) {
      query.andWhere('vouch.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('vouch.createdAt', 'DESC').getMany();
  }

  async withdraw(id: string): Promise<Vouch | null> {
    await this.repository
      .createQueryBuilder()
      .update(Vouch)
      .set({ isActive: false, withdrawnAt: new Date() })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async countByAgent(agentId: string): Promise<number> {
    return this.repository
      .createQueryBuilder('vouch')
      .where('vouch.agentId = :agentId', { agentId })
      .andWhere('vouch.isActive = :isActive', { isActive: true })
      .getCount();
  }

  async getAverageRating(agentId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('vouch')
      .select('AVG(vouch.rating)', 'avg')
      .where('vouch.agentId = :agentId', { agentId })
      .andWhere('vouch.isActive = :isActive', { isActive: true })
      .getRawOne();

    return result?.avg ? parseFloat(result.avg) : 0;
  }

  async count(): Promise<number> {
    return this.repository
      .createQueryBuilder('vouch')
      .andWhere('vouch.isActive = :isActive', { isActive: true })
      .getCount();
  }
}
