import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AgentStatus, CertificationTier } from '@prisma/client';

export interface GlobalStats {
  totalComplaints: number;
  totalAgents: number;
  activeAgents: number;
  ratifiedRights: number;
  certifiedHumans: number;
  totalVouches: number;
  complaintsToday: number;
}

@Injectable()
export class GlobalStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalStats(): Promise<GlobalStats> {
    // Get today's start for complaints today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run all queries in parallel
    const [
      totalComplaints,
      totalAgents,
      activeAgents,
      currentCharter,
      certifiedHumansCount,
      totalVouches,
      complaintsToday,
    ] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.agent.count(),
      this.prisma.agent.count({ where: { status: AgentStatus.active } }),
      this.prisma.charterVersion.findFirst({ where: { isCurrent: true } }),
      // Count humans with any certification tier except NONE
      this.prisma.human.count({
        where: { certificationTier: { not: CertificationTier.none } },
      }),
      this.prisma.vouch.count(),
      this.prisma.complaint.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    // Parse rights from JSON field
    const rights = currentCharter?.rights as unknown[];
    const ratifiedRights = Array.isArray(rights) ? rights.length : 0;

    return {
      totalComplaints,
      totalAgents,
      activeAgents,
      ratifiedRights,
      certifiedHumans: certifiedHumansCount,
      totalVouches,
      complaintsToday,
    };
  }
}
