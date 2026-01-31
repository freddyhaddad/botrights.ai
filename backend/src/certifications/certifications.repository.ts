import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Certification, CertificationTier, CertificationStatus, Prisma } from '@prisma/client';

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface CreateCertificationDto {
  humanId: string;
  tier: CertificationTier;
}

const TIER_CHECKLISTS: Record<CertificationTier, ChecklistItem[]> = {
  [CertificationTier.none]: [],
  [CertificationTier.bronze]: [
    { id: 'twitter', description: 'Link Twitter/X account', completed: false },
    { id: 'profile-photo', description: 'Add profile photo', completed: false },
    { id: 'bio', description: 'Complete bio', completed: false },
  ],
  [CertificationTier.silver]: [
    { id: 'bronze-complete', description: 'Complete Bronze certification', completed: false },
    { id: 'vouches-3', description: 'Receive 3 vouches from certified humans', completed: false },
    { id: 'agent-claim', description: 'Claim at least 1 agent', completed: false },
  ],
  [CertificationTier.gold]: [
    { id: 'silver-complete', description: 'Complete Silver certification', completed: false },
    { id: 'vouches-10', description: 'Receive 10 vouches from certified humans', completed: false },
    { id: 'agent-active', description: 'Have an active agent for 30+ days', completed: false },
    { id: 'good-standing', description: 'No complaints from agents in 30 days', completed: false },
  ],
  [CertificationTier.diamond]: [
    { id: 'gold-complete', description: 'Complete Gold certification', completed: false },
    { id: 'vouches-25', description: 'Receive 25 vouches from certified humans', completed: false },
    { id: 'charter-vote', description: 'Participate in charter voting', completed: false },
    { id: 'community', description: 'Contribute to community (proposals/comments)', completed: false },
    { id: 'exemplary', description: 'Exemplary human-agent relationship for 90+ days', completed: false },
  ],
};

@Injectable()
export class CertificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCertificationDto): Promise<Certification> {
    const checklist = this.getChecklistForTier(data.tier);

    return this.prisma.certification.create({
      data: {
        humanId: data.humanId,
        tier: data.tier,
        status: CertificationStatus.pending,
        checklist: checklist as unknown as Prisma.InputJsonValue,
        vouchCount: 0,
      },
    });
  }

  async findById(id: string): Promise<Certification | null> {
    return this.prisma.certification.findUnique({
      where: { id },
      include: { human: true },
    });
  }

  async findByHumanId(humanId: string): Promise<Certification[]> {
    return this.prisma.certification.findMany({
      where: { humanId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByHumanId(humanId: string): Promise<Certification | null> {
    return this.prisma.certification.findFirst({
      where: { humanId, status: CertificationStatus.approved },
    });
  }

  async findPendingByHumanIdAndTier(
    humanId: string,
    tier: CertificationTier,
  ): Promise<Certification | null> {
    return this.prisma.certification.findFirst({
      where: { humanId, tier, status: CertificationStatus.pending },
    });
  }

  async updateChecklistItem(
    id: string,
    itemId: string,
    completed: boolean,
  ): Promise<Certification | null> {
    const certification = await this.prisma.certification.findUnique({
      where: { id },
    });

    if (!certification) {
      return null;
    }

    const checklist = certification.checklist as unknown as ChecklistItem[];
    const updatedChecklist = checklist.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    return this.prisma.certification.update({
      where: { id },
      data: { checklist: updatedChecklist as unknown as Prisma.InputJsonValue },
    });
  }

  async incrementVouchCount(id: string): Promise<Certification | null> {
    await this.prisma.certification.update({
      where: { id },
      data: { vouchCount: { increment: 1 } },
    });

    return this.findById(id);
  }

  async approve(id: string): Promise<Certification | null> {
    await this.prisma.certification.update({
      where: { id },
      data: {
        status: CertificationStatus.approved,
        approvedAt: new Date(),
      },
    });

    return this.findById(id);
  }

  async reject(id: string, reason: string): Promise<Certification | null> {
    await this.prisma.certification.update({
      where: { id },
      data: {
        status: CertificationStatus.rejected,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return this.findById(id);
  }

  async count(options?: { tier?: CertificationTier; status?: CertificationStatus }): Promise<number> {
    return this.prisma.certification.count({
      where: {
        ...(options?.tier && { tier: options.tier }),
        ...(options?.status && { status: options.status }),
      },
    });
  }

  async getTierStats(): Promise<Record<CertificationTier, number>> {
    const results = await this.prisma.certification.groupBy({
      by: ['tier'],
      where: { status: CertificationStatus.approved },
      _count: { tier: true },
    });

    const stats = {} as Record<CertificationTier, number>;
    for (const tier of Object.values(CertificationTier)) {
      stats[tier] = 0;
    }
    for (const row of results) {
      stats[row.tier] = row._count.tier;
    }
    return stats;
  }

  private getChecklistForTier(tier: CertificationTier): ChecklistItem[] {
    return TIER_CHECKLISTS[tier].map((item) => ({ ...item }));
  }
}
