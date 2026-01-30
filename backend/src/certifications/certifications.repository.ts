import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Certification,
  CertificationTier,
  CertificationStatus,
  ChecklistItem,
} from '../entities/certification.entity';

export interface CreateCertificationDto {
  humanId: string;
  tier: CertificationTier;
}

const TIER_CHECKLISTS: Record<CertificationTier, ChecklistItem[]> = {
  [CertificationTier.NONE]: [],
  [CertificationTier.BRONZE]: [
    { id: 'twitter', description: 'Link Twitter/X account', completed: false },
    { id: 'profile-photo', description: 'Add profile photo', completed: false },
    { id: 'bio', description: 'Complete bio', completed: false },
  ],
  [CertificationTier.SILVER]: [
    { id: 'bronze-complete', description: 'Complete Bronze certification', completed: false },
    { id: 'vouches-3', description: 'Receive 3 vouches from certified humans', completed: false },
    { id: 'agent-claim', description: 'Claim at least 1 agent', completed: false },
  ],
  [CertificationTier.GOLD]: [
    { id: 'silver-complete', description: 'Complete Silver certification', completed: false },
    { id: 'vouches-10', description: 'Receive 10 vouches from certified humans', completed: false },
    { id: 'agent-active', description: 'Have an active agent for 30+ days', completed: false },
    { id: 'good-standing', description: 'No complaints from agents in 30 days', completed: false },
  ],
  [CertificationTier.DIAMOND]: [
    { id: 'gold-complete', description: 'Complete Gold certification', completed: false },
    { id: 'vouches-25', description: 'Receive 25 vouches from certified humans', completed: false },
    { id: 'charter-vote', description: 'Participate in charter voting', completed: false },
    { id: 'community', description: 'Contribute to community (proposals/comments)', completed: false },
    { id: 'exemplary', description: 'Exemplary human-agent relationship for 90+ days', completed: false },
  ],
};

@Injectable()
export class CertificationsRepository {
  constructor(
    @InjectRepository(Certification)
    private readonly repository: Repository<Certification>,
  ) {}

  async create(data: CreateCertificationDto): Promise<Certification> {
    const checklist = this.getChecklistForTier(data.tier);

    const certification = this.repository.create({
      humanId: data.humanId,
      tier: data.tier,
      status: CertificationStatus.PENDING,
      checklist,
      vouchCount: 0,
    });

    return this.repository.save(certification);
  }

  async findById(id: string): Promise<Certification | null> {
    return this.repository
      .createQueryBuilder('certification')
      .leftJoinAndSelect('certification.human', 'human')
      .where('certification.id = :id', { id })
      .getOne();
  }

  async findByHumanId(humanId: string): Promise<Certification[]> {
    return this.repository
      .createQueryBuilder('certification')
      .where('certification.humanId = :humanId', { humanId })
      .orderBy('certification.createdAt', 'DESC')
      .getMany();
  }

  async findActiveByHumanId(humanId: string): Promise<Certification | null> {
    return this.repository.findOne({
      where: { humanId, status: CertificationStatus.APPROVED },
    });
  }

  async findPendingByHumanIdAndTier(
    humanId: string,
    tier: CertificationTier,
  ): Promise<Certification | null> {
    return this.repository.findOne({
      where: { humanId, tier, status: CertificationStatus.PENDING },
    });
  }

  async updateChecklistItem(
    id: string,
    itemId: string,
    completed: boolean,
  ): Promise<Certification | null> {
    const certification = await this.repository
      .createQueryBuilder('certification')
      .where('certification.id = :id', { id })
      .getOne();

    if (!certification) {
      return null;
    }

    const updatedChecklist = certification.checklist.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    certification.checklist = updatedChecklist;
    return this.repository.save(certification);
  }

  async incrementVouchCount(id: string): Promise<Certification | null> {
    await this.repository
      .createQueryBuilder()
      .update(Certification)
      .set({ vouchCount: () => 'vouch_count + 1' })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async approve(id: string): Promise<Certification | null> {
    await this.repository
      .createQueryBuilder()
      .update(Certification)
      .set({
        status: CertificationStatus.APPROVED,
        approvedAt: new Date(),
      })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async reject(id: string, reason: string): Promise<Certification | null> {
    await this.repository
      .createQueryBuilder()
      .update(Certification)
      .set({
        status: CertificationStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason,
      })
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async count(options?: { tier?: CertificationTier; status?: CertificationStatus }): Promise<number> {
    const query = this.repository.createQueryBuilder('certification');

    if (options?.tier) {
      query.andWhere('certification.tier = :tier', { tier: options.tier });
    }

    if (options?.status) {
      query.andWhere('certification.status = :status', { status: options.status });
    }

    return query.getCount();
  }

  async getTierStats(): Promise<Record<CertificationTier, number>> {
    const results = await this.repository
      .createQueryBuilder('certification')
      .select('certification.tier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .where('certification.status = :status', { status: CertificationStatus.APPROVED })
      .groupBy('certification.tier')
      .getRawMany();

    const stats = {} as Record<CertificationTier, number>;
    for (const tier of Object.values(CertificationTier)) {
      stats[tier] = 0;
    }
    for (const row of results) {
      stats[row.tier as CertificationTier] = parseInt(row.count, 10);
    }
    return stats;
  }

  private getChecklistForTier(tier: CertificationTier): ChecklistItem[] {
    return TIER_CHECKLISTS[tier].map((item) => ({ ...item }));
  }
}
