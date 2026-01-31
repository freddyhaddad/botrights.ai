import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReportPeriod } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}

  async getHistorical(
    granularity: Granularity,
    startDate?: Date,
    endDate?: Date,
  ): Promise<HistoricalResult> {
    const periodFormat = granularity === Granularity.WEEKLY
      ? "TO_CHAR(period_start, 'IYYY-\"W\"IW')"
      : "TO_CHAR(period_start, 'YYYY-MM')";

    // Build where conditions
    let whereClause = `WHERE period = 'daily'`;
    if (startDate) {
      whereClause += ` AND period_start >= '${startDate.toISOString()}'`;
    }
    if (endDate) {
      whereClause += ` AND period_start <= '${endDate.toISOString()}'`;
    }

    const rawData = await this.prisma.$queryRawUnsafe<Array<{
      period: string;
      totalinteractions: bigint;
      totalreports: bigint;
      avgsuccessrate: number;
      avgcomplaints: number;
    }>>(`
      SELECT
        ${periodFormat} as period,
        SUM(total_interactions) as totalInteractions,
        COUNT(*) as totalReports,
        AVG(CASE WHEN total_interactions > 0 THEN CAST(successful_interactions AS FLOAT) / total_interactions ELSE 0 END) as avgSuccessRate,
        AVG(complaints_received) as avgComplaints
      FROM stat_reports
      ${whereClause}
      GROUP BY ${periodFormat}
      ORDER BY ${periodFormat} ASC
    `);

    const data: HistoricalDataPoint[] = rawData.map((row) => ({
      period: row.period,
      totalInteractions: Number(row.totalinteractions || 0),
      totalReports: Number(row.totalreports || 0),
      avgSuccessRate: Number(row.avgsuccessrate || 0),
      avgComplaints: Number(row.avgcomplaints || 0),
    }));

    return {
      granularity,
      data,
    };
  }
}
