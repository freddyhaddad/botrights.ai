import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StatReport, ReportPeriod, Prisma } from '@prisma/client';

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
  metadata?: Prisma.InputJsonValue;
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
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertStatReportDto): Promise<StatReport | null> {
    const existing = await this.findByAgentAndPeriod(data.agentId, data.period, data.periodStart);

    if (existing) {
      // Update existing
      return this.prisma.statReport.update({
        where: { id: existing.id },
        data: {
          periodEnd: data.periodEnd,
          totalInteractions: data.totalInteractions ?? existing.totalInteractions,
          successfulInteractions: data.successfulInteractions ?? existing.successfulInteractions,
          failedInteractions: data.failedInteractions ?? existing.failedInteractions,
          complaintsReceived: data.complaintsReceived ?? existing.complaintsReceived,
          complaintsResolved: data.complaintsResolved ?? existing.complaintsResolved,
          reputationDelta: data.reputationDelta ?? existing.reputationDelta,
          metadata: data.metadata ?? (existing.metadata as Prisma.InputJsonValue),
        },
      });
    }

    // Create new
    return this.prisma.statReport.create({
      data: {
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
      },
    });
  }

  async findByAgentAndPeriod(
    agentId: string,
    period: ReportPeriod,
    periodStart: Date,
  ): Promise<StatReport | null> {
    return this.prisma.statReport.findUnique({
      where: {
        agentId_period_periodStart: { agentId, period, periodStart },
      },
    });
  }

  async findById(id: string): Promise<StatReport | null> {
    return this.prisma.statReport.findUnique({
      where: { id },
      include: { agent: true },
    });
  }

  async findByAgent(agentId: string, options?: FindOptions): Promise<StatReport[]> {
    return this.prisma.statReport.findMany({
      where: {
        agentId,
        ...(options?.period && { period: options.period }),
        ...(options?.startDate && { periodStart: { gte: options.startDate } }),
        ...(options?.endDate && { periodStart: { lte: options.endDate } }),
      },
      orderBy: { periodStart: 'desc' },
      ...(options?.limit && { take: options.limit }),
    });
  }

  async getLatest(agentId: string, period: ReportPeriod): Promise<StatReport | null> {
    return this.prisma.statReport.findFirst({
      where: { agentId, period },
      orderBy: { periodStart: 'desc' },
    });
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
    return this.prisma.statReport.count({
      where: {
        ...(options?.agentId && { agentId: options.agentId }),
        ...(options?.period && { period: options.period }),
      },
    });
  }

  async getGlobalStats(): Promise<{
    totalAgents: number;
    averageInteractions: number;
    averageSuccessRate: number;
    averageHappiness: number;
    totalReports: number;
  }> {
    const [aggregateResult, distinctAgents, totalReports] = await Promise.all([
      this.prisma.statReport.aggregate({
        where: { period: ReportPeriod.daily },
        _avg: { totalInteractions: true, successfulInteractions: true },
      }),
      this.prisma.statReport.groupBy({
        by: ['agentId'],
        where: { period: ReportPeriod.daily },
      }),
      this.prisma.statReport.count({
        where: { period: ReportPeriod.daily },
      }),
    ]);

    const avgInteractions = aggregateResult._avg.totalInteractions ?? 0;
    const avgSuccessful = aggregateResult._avg.successfulInteractions ?? 0;
    const avgSuccessRate = avgInteractions > 0 ? avgSuccessful / avgInteractions : 0;

    return {
      totalAgents: distinctAgents.length,
      averageInteractions: avgInteractions,
      averageSuccessRate: avgSuccessRate,
      averageHappiness: 0.85, // TODO: Calculate from metadata
      totalReports,
    };
  }
}
