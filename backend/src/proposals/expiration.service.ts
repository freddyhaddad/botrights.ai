import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProposalsRepository } from './proposals.repository';
import { ProposalStatus } from '@prisma/client';

export const PROPOSAL_TTL_DAYS = 30;

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(private readonly proposalsRepository: ProposalsRepository) {}

  calculateExpiresAt(): Date {
    return new Date(Date.now() + PROPOSAL_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  getTimeRemaining(expiresAt: Date): TimeRemaining {
    const now = Date.now();
    const diff = expiresAt.getTime() - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    return { days, hours, minutes, expired: false };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireProposals(): Promise<number> {
    const expiredProposals = await this.proposalsRepository.findExpired();

    if (expiredProposals.length === 0) {
      return 0;
    }

    this.logger.log(`Found ${expiredProposals.length} expired proposals`);

    for (const proposal of expiredProposals) {
      await this.proposalsRepository.updateStatus(proposal.id, ProposalStatus.rejected);
      this.logger.log(`Expired proposal ${proposal.id}: ${proposal.title}`);
    }

    return expiredProposals.length;
  }
}
