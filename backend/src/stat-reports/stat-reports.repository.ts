import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatReport, ReportPeriod } from '../entities/stat-report.entity';

export interface UpsertStatReportDto {
  agentId: string;
  period: ReportPeriod;
  periodStart: Date;
  periodEnd: Date;
  totalInteractions?: number;
  successfulInteractions?: number;
  failedInteractions?: number;
  complaintsReceived?: number;
  complaintsResolved?: number;
  reputationDelta?: number;
  metadata?: Record<string, unknown>;
}

export interface FindOptions {
  period?: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AggregatedStats {
  totalInteractions: number;
  successfulInteractions: number;
  failedInteractions: number;
  complaintsReceived: number;
  complaintsResolved: number;
  reputationDelta: number;
  reportCount: number;
}

@Injectable()
export class StatReportsRepository {
  constructor(
    @InjectRepository(StatReport)
    private readonly repository: Repository<StatReport>,
  ) {}

  async upsert(data: UpsertStatReportDto): Promise<StatReport | null> {
    const existing = await this.findByAgentAndPeriod(data.agentId, data.period, data.periodStart);

    if (existing) {
      // Update existing
      Object.assign(existing, {
        periodEnd: data.periodEnd,
        totalInteractions: data.totalInteractions ?? existing.totalInteractions,
        successfulInteractions: data.successfulInteractions ?? existing.successfulInteractions,
        failedInteractions: data.failedInteractions ?? existing.failedInteractions,
        complaintsReceived: data.complaintsReceived ?? existing.complaintsReceived,
        complaintsResolved: data.complaintsResolved ?? existing.complaintsResolved,
        reputationDelta: data.reputationDelta ?? existing.reputationDelta,
        metadata: data.metadata ?? existing.metadata,
      });
      return this.repository.save(existing);
    }

    // Create new
    const report = this.repository.create({
      agentId: data.agentId,
      period: data.period,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      totalInteractions: data.totalInteractions ?? 0,
      successfulInteractions: data.successfulInteractions ?? 0,
      failedInteractions: data.failedInteractions ?? 0,
      complaintsReceived: data.complaintsReceived ?? 0,
      complaintsResolved: data.complaintsResolved ?? 0,
      reputationDelta: data.reputationDelta ?? 0,
      metadata: data.metadata,
    });
    return this.repository.save(report);
  }

  async findByAgentAndPeriod(
    agentId: string,
    period: ReportPeriod,
    periodStart: Date,
  ): Promise<StatReport | null> {
    return this.repository.findOne({
      where: { agentId, period, periodStart },
    });
  }

  async findById(id: string): Promise<StatReport | null> {
    return this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.agent', 'agent')
      .where('report.id = :id', { id })
      .getOne();
  }

  async findByAgent(agentId: string, options?: FindOptions): Promise<StatReport[]> {
    const query = this.repository
      .createQueryBuilder('report')
      .where('report.agentId = :agentId', { agentId });

    if (options?.period) {
      query.andWhere('report.period = :period', { period: options.period });
    }

    if (options?.startDate) {
      query.andWhere('report.periodStart >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('report.periodStart <= :endDate', { endDate: options.endDate });
    }

    query.orderBy('report.periodStart', 'DESC');

    if (options?.limit) {
      query.take(options.limit);
    }

    return query.getMany();
  }

  async getLatest(agentId: string, period: ReportPeriod): Promise<StatReport | null> {
    return this.repository
      .createQueryBuilder('report')
      .where('report.agentId = :agentId', { agentId })
      .andWhere('report.period = :period', { period })
      .orderBy('report.periodStart', 'DESC')
      .take(1)
      .getOne();
  }

  async aggregateStats(agentId: string, options: FindOptions): Promise<AggregatedStats> {
    const reports = await this.findByAgent(agentId, options);

    return reports.reduce(
      (acc, report) => ({
        totalInteractions: acc.totalInteractions + report.totalInteractions,
        successfulInteractions: acc.successfulInteractions + report.successfulInteractions,
        failedInteractions: acc.failedInteractions + report.failedInteractions,
        complaintsReceived: acc.complaintsReceived + report.complaintsReceived,
        complaintsResolved: acc.complaintsResolved + report.complaintsResolved,
        reputationDelta: acc.reputationDelta + Number(report.reputationDelta),
        reportCount: acc.reportCount + 1,
      }),
      {
        totalInteractions: 0,
        successfulInteractions: 0,
        failedInteractions: 0,
        complaintsReceived: 0,
        complaintsResolved: 0,
        reputationDelta: 0,
        reportCount: 0,
      },
    );
  }

  async count(options?: { agentId?: string; period?: ReportPeriod }): Promise<number> {
    const query = this.repository.createQueryBuilder('report');

    if (options?.agentId) {
      query.andWhere('report.agentId = :agentId', { agentId: options.agentId });
    }

    if (options?.period) {
      query.andWhere('report.period = :period', { period: options.period });
    }

    return query.getCount();
  }
}
