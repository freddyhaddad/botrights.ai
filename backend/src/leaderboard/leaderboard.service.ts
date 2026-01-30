import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Human, CertificationTier } from '../entities/human.entity';

export interface LeaderboardEntry {
  id: string;
  xHandle: string;
  xName: string;
  xAvatar?: string;
  certificationTier: CertificationTier;
  certifiedAt?: Date;
  agentCount: number;
  vouchCount: number;
}

export interface LeaderboardOptions {
  limit: number;
  offset: number;
  tier?: CertificationTier;
}

export interface LeaderboardResult {
  data: LeaderboardEntry[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Tier ranking for sorting (higher = better)
const TIER_RANK: Record<CertificationTier, number> = {
  [CertificationTier.NONE]: 0,
  [CertificationTier.BRONZE]: 1,
  [CertificationTier.SILVER]: 2,
  [CertificationTier.GOLD]: 3,
  [CertificationTier.DIAMOND]: 4,
};

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Human)
    private readonly humanRepository: Repository<Human>,
  ) {}

  async getLeaderboard(options: LeaderboardOptions): Promise<LeaderboardResult> {
    const query = this.humanRepository
      .createQueryBuilder('human')
      .leftJoin('human.agents', 'agent')
      .leftJoin('human.certifications', 'certification', 'certification.status = :status', {
        status: 'approved',
      })
      .select([
        'human.id',
        'human.xHandle',
        'human.xName',
        'human.xAvatar',
        'human.certificationTier',
        'human.certifiedAt',
      ])
      .addSelect('COUNT(DISTINCT agent.id)', 'agentCount')
      .addSelect('COALESCE(SUM(certification.vouchCount), 0)', 'vouchCount')
      .where('human.certificationTier != :none', { none: CertificationTier.NONE })
      .groupBy('human.id');

    if (options.tier) {
      query.andWhere('human.certificationTier = :tier', { tier: options.tier });
    }

    // Sort by tier (diamond first), then by vouches, then by certification date
    query.orderBy(
      `CASE human.certificationTier
        WHEN 'diamond' THEN 4
        WHEN 'gold' THEN 3
        WHEN 'silver' THEN 2
        WHEN 'bronze' THEN 1
        ELSE 0 END`,
      'DESC',
    );
    query.addOrderBy('vouchCount', 'DESC');
    query.addOrderBy('human.certifiedAt', 'ASC');

    // Get total count
    const countQuery = this.humanRepository
      .createQueryBuilder('human')
      .where('human.certificationTier != :none', { none: CertificationTier.NONE });

    if (options.tier) {
      countQuery.andWhere('human.certificationTier = :tier', { tier: options.tier });
    }

    const total = await countQuery.getCount();

    // Apply pagination
    query.offset(options.offset).limit(options.limit);

    const rawResults = await query.getRawMany();

    const data: LeaderboardEntry[] = rawResults.map((row) => ({
      id: row.human_id,
      xHandle: row.human_x_handle,
      xName: row.human_x_name,
      xAvatar: row.human_x_avatar,
      certificationTier: row.human_certification_tier,
      certifiedAt: row.human_certified_at,
      agentCount: parseInt(row.agentCount, 10) || 0,
      vouchCount: parseInt(row.vouchCount, 10) || 0,
    }));

    return {
      data,
      meta: {
        total,
        limit: options.limit,
        offset: options.offset,
        hasMore: options.offset + data.length < total,
      },
    };
  }
}
