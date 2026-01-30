import { Injectable } from '@nestjs/common';
import { HistoricalService, Granularity, HistoricalDataPoint } from './historical.service';

@Injectable()
export class ExportService {
  constructor(private readonly historicalService: HistoricalService) {}

  async exportCsv(
    granularity: Granularity,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    const result = await this.historicalService.getHistorical(granularity, startDate, endDate);

    const headers = ['period', 'totalInteractions', 'totalReports', 'avgSuccessRate', 'avgComplaints'];
    const lines: string[] = [headers.join(',')];

    for (const row of result.data) {
      lines.push([
        row.period,
        row.totalInteractions.toString(),
        row.totalReports.toString(),
        row.avgSuccessRate.toString(),
        row.avgComplaints.toString(),
      ].join(','));
    }

    return lines.join('\n');
  }

  generateFilename(
    granularity: Granularity,
    startDate?: Date,
    endDate?: Date,
  ): string {
    const parts = ['botrights-stats', granularity];

    if (startDate && endDate) {
      parts.push(this.formatDate(startDate));
      parts.push('to');
      parts.push(this.formatDate(endDate));
    } else {
      parts.push(this.formatDate(new Date()));
    }

    return parts.join('-') + '.csv';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
