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
    // Build where clause - only show certified humans (not 'none')
    const where: { certificationTier?: CertificationTier | { not: CertificationTier } } = {
      certificationTier: { not: CertificationTier.none },
    };

    if (options.tier) {
      where.certificationTier = options.tier;
    }

    // Get total count
    const total = await this.prisma.human.count({ where });

    // Get humans with related counts using Prisma's query builder
    const humans = await this.prisma.human.findMany({
      where,
      include: {
        _count: {
          select: { agents: true },
        },
        certifications: {
          where: { status: 'approved' },
          select: { vouchCount: true },
        },
      },
    });

    // Map and sort in JS (tier rank desc, vouch count desc, certified date asc)
    const sorted = humans
      .map((h) => ({
        id: h.id,
        xHandle: h.xHandle,
        xName: h.xName,
        xAvatar: h.xAvatar ?? undefined,
        certificationTier: h.certificationTier,
        certifiedAt: h.certifiedAt ?? undefined,
        agentCount: h._count.agents,
        vouchCount: h.certifications.reduce((sum, c) => sum + c.vouchCount, 0),
      }))
      .sort((a, b) => {
        // Sort by tier rank (desc)
        const tierDiff = TIER_RANK[b.certificationTier] - TIER_RANK[a.certificationTier];
        if (tierDiff !== 0) return tierDiff;

        // Then by vouch count (desc)
        const vouchDiff = b.vouchCount - a.vouchCount;
        if (vouchDiff !== 0) return vouchDiff;

        // Then by certified date (asc) - earlier certified first
        const aDate = a.certifiedAt ? new Date(a.certifiedAt).getTime() : Infinity;
        const bDate = b.certifiedAt ? new Date(b.certifiedAt).getTime() : Infinity;
        return aDate - bDate;
      });

    // Apply pagination
    const data = sorted.slice(options.offset, options.offset + options.limit);

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
