import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Not, Equal } from 'typeorm';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { Complaint } from '../entities/complaint.entity';
import { CharterVersion } from '../entities/charter-version.entity';
import { Human } from '../entities/human.entity';
import { CertificationTier } from '../entities/enums';
import { Vouch } from '../entities/vouch.entity';

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
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(CharterVersion)
    private readonly charterRepository: Repository<CharterVersion>,
    @InjectRepository(Human)
    private readonly humanRepository: Repository<Human>,
    @InjectRepository(Vouch)
    private readonly vouchRepository: Repository<Vouch>,
  ) {}

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
      this.complaintRepository.count(),
      this.agentRepository.count(),
      this.agentRepository.count({ where: { status: AgentStatus.ACTIVE } }),
      this.charterRepository.findOne({ where: { isCurrent: true } }),
      // Count humans with any certification tier except NONE
      this.humanRepository.count({
        where: { certificationTier: Not(Equal(CertificationTier.NONE)) },
      }),
      this.vouchRepository.count(),
      this.complaintRepository.count({
        where: { createdAt: MoreThanOrEqual(today) },
      }),
    ]);

    return {
      totalComplaints,
      totalAgents,
      activeAgents,
      ratifiedRights: currentCharter?.rights?.length ?? 0,
      certifiedHumans: certifiedHumansCount,
      totalVouches,
      complaintsToday,
    };
  }
}
