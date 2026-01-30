import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatReport, ReportPeriod } from '../entities/stat-report.entity';

export enum Granularity {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface HistoricalDataPoint {
  period: string;
  totalInteractions: number;
  totalReports: number;
  avgSuccessRate: number;
  avgComplaints: number;
}

export interface HistoricalResult {
  granularity: Granularity;
  data: HistoricalDataPoint[];
}

@Injectable()
export class HistoricalService {
  constructor(
    @InjectRepository(StatReport)
    private readonly repository: Repository<StatReport>,
  ) {}

  async getHistorical(
    granularity: Granularity,
    startDate?: Date,
    endDate?: Date,
  ): Promise<HistoricalResult> {
    const periodFormat = granularity === Granularity.WEEKLY
      ? "TO_CHAR(report.period_start, 'IYYY-\"W\"IW')"
      : "TO_CHAR(report.period_start, 'YYYY-MM')";

    const query = this.repository
      .createQueryBuilder('report')
      .select(periodFormat, 'period')
      .addSelect('SUM(report.total_interactions)', 'totalInteractions')
      .addSelect('COUNT(*)', 'totalReports')
      .addSelect(
        'AVG(CASE WHEN report.total_interactions > 0 THEN CAST(report.successful_interactions AS FLOAT) / report.total_interactions ELSE 0 END)',
        'avgSuccessRate',
      )
      .addSelect('AVG(report.complaints_received)', 'avgComplaints')
      .where('report.period = :period', { period: ReportPeriod.DAILY });

    if (startDate) {
      query.andWhere('report.period_start >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('report.period_start <= :endDate', { endDate });
    }

    query
      .groupBy(periodFormat)
      .orderBy(periodFormat, 'ASC');

    const rawData = await query.getRawMany();

    const data: HistoricalDataPoint[] = rawData.map((row) => ({
      period: row.period,
      totalInteractions: parseInt(row.totalInteractions || '0', 10),
      totalReports: parseInt(row.totalReports || '0', 10),
      avgSuccessRate: parseFloat(row.avgSuccessRate || '0'),
      avgComplaints: parseFloat(row.avgComplaints || '0'),
    }));

    return {
      granularity,
      data,
    };
  }
}
