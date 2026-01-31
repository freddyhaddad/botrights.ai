import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Vouch } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}

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

    const vouch = await this.prisma.vouch.create({
      data: {
        voucherId: data.voucherId,
        agentId: data.agentId,
        endorsement: data.endorsement,
        rating: data.rating,
        isActive: true,
      },
    });

    return { vouch };
  }

  async findByVoucherAndAgent(voucherId: string, agentId: string): Promise<Vouch | null> {
    return this.prisma.vouch.findUnique({
      where: {
        voucherId_agentId: { voucherId, agentId },
      },
    });
  }

  async findById(id: string): Promise<Vouch | null> {
    return this.prisma.vouch.findUnique({
      where: { id },
      include: {
        voucher: true,
        agent: true,
      },
    });
  }

  async findByAgent(agentId: string, includeInactive = false): Promise<Vouch[]> {
    return this.prisma.vouch.findMany({
      where: {
        agentId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { voucher: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVoucher(voucherId: string, includeInactive = false): Promise<Vouch[]> {
    return this.prisma.vouch.findMany({
      where: {
        voucherId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async withdraw(id: string): Promise<Vouch | null> {
    await this.prisma.vouch.update({
      where: { id },
      data: { isActive: false, withdrawnAt: new Date() },
    });

    return this.findById(id);
  }

  async countByAgent(agentId: string): Promise<number> {
    return this.prisma.vouch.count({
      where: { agentId, isActive: true },
    });
  }

  async getAverageRating(agentId: string): Promise<number> {
    const result = await this.prisma.vouch.aggregate({
      where: { agentId, isActive: true },
      _avg: { rating: true },
    });

    return result._avg.rating ?? 0;
  }

  async count(): Promise<number> {
    return this.prisma.vouch.count({
      where: { isActive: true },
    });
  }
}
