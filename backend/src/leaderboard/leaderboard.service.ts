import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CertificationTier } from '@prisma/client';

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
  [CertificationTier.none]: 0,
  [CertificationTier.bronze]: 1,
  [CertificationTier.silver]: 2,
  [CertificationTier.gold]: 3,
  [CertificationTier.diamond]: 4,
};

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(options: LeaderboardOptions): Promise<LeaderboardResult> {
    // Build where clause
    const where: { certificationTier?: CertificationTier | { not: CertificationTier } } = {
      certificationTier: { not: CertificationTier.none },
    };

    if (options.tier) {
      where.certificationTier = options.tier;
    }

    // Get total count
    const total = await this.prisma.human.count({ where });

    // Get humans with aggregated data using raw query for complex sorting
    // Prisma doesn't support CASE expressions in orderBy, so we use $queryRaw
    const rawResults = await this.prisma.$queryRaw<Array<{
      id: string;
      x_handle: string;
      x_name: string;
      x_avatar: string | null;
      certification_tier: string;
      certified_at: Date | null;
      agent_count: bigint;
      vouch_count: bigint;
    }>>`
      SELECT
        h.id,
        h.x_handle,
        h.x_name,
        h.x_avatar,
        h.certification_tier,
        h.certified_at,
        COUNT(DISTINCT a.id) as agent_count,
        COALESCE(SUM(c.vouch_count), 0) as vouch_count
      FROM humans h
      LEFT JOIN agents a ON a.human_id = h.id
      LEFT JOIN certifications c ON c.human_id = h.id AND c.status = 'approved'
      WHERE h.certification_tier != 'none'
      ${options.tier ? this.prisma.$queryRaw`AND h.certification_tier = ${options.tier}` : this.prisma.$queryRaw``}
      GROUP BY h.id
      ORDER BY
        CASE h.certification_tier
          WHEN 'diamond' THEN 4
          WHEN 'gold' THEN 3
          WHEN 'silver' THEN 2
          WHEN 'bronze' THEN 1
          ELSE 0
        END DESC,
        vouch_count DESC,
        h.certified_at ASC
      LIMIT ${options.limit}
      OFFSET ${options.offset}
    `;

    const data: LeaderboardEntry[] = rawResults.map((row) => ({
      id: row.id,
      xHandle: row.x_handle,
      xName: row.x_name,
      xAvatar: row.x_avatar ?? undefined,
      certificationTier: row.certification_tier as CertificationTier,
      certifiedAt: row.certified_at ?? undefined,
      agentCount: Number(row.agent_count),
      vouchCount: Number(row.vouch_count),
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
