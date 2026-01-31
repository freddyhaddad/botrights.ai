import { Injectable } from '@nestjs/common';
import { CertificationsRepository, ChecklistItem } from './certifications.repository';
import { HumansRepository } from '../humans/humans.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { CertificationTier } from '@prisma/client';

interface TierRequirements {
  minVouches: number;
  minDays: number;
  requiresComplaintFree: boolean;
  complaintFreeDays?: number;
}

const TIER_REQUIREMENTS: Record<CertificationTier, TierRequirements> = {
  [CertificationTier.none]: {
    minVouches: 0,
    minDays: 0,
    requiresComplaintFree: false,
  },
  [CertificationTier.bronze]: {
    minVouches: 1,
    minDays: 0,
    requiresComplaintFree: false,
  },
  [CertificationTier.silver]: {
    minVouches: 3,
    minDays: 30,
    requiresComplaintFree: false,
  },
  [CertificationTier.gold]: {
    minVouches: 10,
    minDays: 90,
    requiresComplaintFree: true,
    complaintFreeDays: 30,
  },
  [CertificationTier.diamond]: {
    minVouches: 25,
    minDays: 90,
    requiresComplaintFree: true,
    complaintFreeDays: 90,
  },
};

export interface TierEligibility {
  eligible: boolean;
  missing: string[];
}

export interface TierUpgradeResult {
  upgraded: boolean;
  reason?: string;
}

@Injectable()
export class TierService {
  constructor(
    private readonly certificationsRepository: CertificationsRepository,
    private readonly humansRepository: HumansRepository,
    private readonly complaintsRepository: ComplaintsRepository,
  ) {}

  async checkEligibility(
    humanId: string,
    targetTier: CertificationTier,
    agentIds: string[] = [],
  ): Promise<TierEligibility> {
    const missing: string[] = [];

    // Get pending certification for target tier
    const pendingCert = await this.certificationsRepository.findPendingByHumanIdAndTier(
      humanId,
      targetTier,
    );

    if (!pendingCert) {
      return { eligible: false, missing: ['certification'] };
    }

    const requirements = TIER_REQUIREMENTS[targetTier];

    // Check checklist completion
    const checklist = pendingCert.checklist as unknown as ChecklistItem[];
    const checklistComplete = checklist.every((item) => item.completed);
    if (!checklistComplete) {
      missing.push('checklist');
    }

    // Check vouch count
    if (pendingCert.vouchCount < requirements.minVouches) {
      missing.push('vouches');
    }

    // Check time requirement for non-Bronze tiers
    if (requirements.minDays > 0) {
      const currentCert = await this.certificationsRepository.findActiveByHumanId(humanId);
      if (!currentCert || !currentCert.approvedAt) {
        missing.push('time');
      } else {
        const daysSinceApproval = this.daysSince(currentCert.approvedAt);
        if (daysSinceApproval < requirements.minDays) {
          missing.push('time');
        }
      }
    }

    // Check complaint-free requirement for Gold and Diamond
    if (requirements.requiresComplaintFree && agentIds.length > 0) {
      const hasRecentComplaints = await this.hasRecentComplaints(
        agentIds,
        requirements.complaintFreeDays || 30,
      );
      if (hasRecentComplaints) {
        missing.push('complaints');
      }
    }

    return {
      eligible: missing.length === 0,
      missing,
    };
  }

  async upgradeTier(
    humanId: string,
    targetTier: CertificationTier,
    agentIds: string[] = [],
  ): Promise<TierUpgradeResult> {
    const eligibility = await this.checkEligibility(humanId, targetTier, agentIds);

    if (!eligibility.eligible) {
      return {
        upgraded: false,
        reason: `Missing requirements: ${eligibility.missing.join(', ')}`,
      };
    }

    // Get pending certification
    const pendingCert = await this.certificationsRepository.findPendingByHumanIdAndTier(
      humanId,
      targetTier,
    );

    if (!pendingCert) {
      return { upgraded: false, reason: 'No pending certification found' };
    }

    // Approve certification
    await this.certificationsRepository.approve(pendingCert.id);

    // Update human's tier
    await this.humansRepository.updateCertification(humanId, targetTier);

    return { upgraded: true };
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const then = new Date(date);
    return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async hasRecentComplaints(agentIds: string[], days: number): Promise<boolean> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    for (const agentId of agentIds) {
      const complaints = await this.complaintsRepository.findByAgentId(agentId);
      const recentComplaints = complaints.filter(
        (c) => new Date(c.createdAt) >= cutoff,
      );
      if (recentComplaints.length > 0) {
        return true;
      }
    }

    return false;
  }
}
