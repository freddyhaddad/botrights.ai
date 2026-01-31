import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent, ReportPeriod, Prisma } from '@prisma/client';
import { StatReportsRepository } from './stat-reports.repository';
import { CompareService } from './compare.service';
import { HistoricalService, Granularity } from './historical.service';
import { ExportService } from './export.service';
import { GlobalStatsService } from './global-stats.service';

interface ReportStatsDto {
  totalInteractions?: number;
  successfulInteractions?: number;
  failedInteractions?: number;
  complaintsReceived?: number;
  complaintsResolved?: number;
  reputationDelta?: number;
  metadata?: Prisma.InputJsonValue;
}

@Controller('api/v1/stats')
export class StatReportsController {
  constructor(
    private readonly statReportsRepository: StatReportsRepository,
    private readonly compareService: CompareService,
    private readonly historicalService: HistoricalService,
    private readonly exportService: ExportService,
    private readonly globalStatsService: GlobalStatsService,
  ) {}

  @Post('report')
  @UseGuards(ApiKeyGuard)
  async report(@Body() dto: ReportStatsDto, @CurrentAgent() agent: Agent) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    // Check if already reported today
    const latest = await this.statReportsRepository.getLatest(agent.id, ReportPeriod.daily);
    if (latest) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const latestDate = new Date(latest.periodStart);
      latestDate.setHours(0, 0, 0, 0);

      if (latestDate.getTime() === today.getTime()) {
        throw new BadRequestException('Already reported stats today');
      }
    }

    // Create daily report
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);

    const report = await this.statReportsRepository.upsert({
      agentId: agent.id,
      period: ReportPeriod.daily,
      periodStart,
      periodEnd,
      totalInteractions: dto.totalInteractions,
      successfulInteractions: dto.successfulInteractions,
      failedInteractions: dto.failedInteractions,
      complaintsReceived: dto.complaintsReceived,
      complaintsResolved: dto.complaintsResolved,
      reputationDelta: dto.reputationDelta,
      metadata: dto.metadata,
    });

    return report;
  }

  @Get('global')
  async getGlobalStats() {
    return this.globalStatsService.getGlobalStats();
  }

  @Get('compare')
  @UseGuards(ApiKeyGuard)
  async compare(@CurrentAgent() agent: Agent) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    return this.compareService.compare(agent);
  }

  @Get('historical')
  async getHistorical(
    @Query('granularity') granularity?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const gran = (granularity === 'monthly' ? Granularity.MONTHLY : Granularity.WEEKLY);
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    return this.historicalService.getHistorical(gran, startDate, endDate);
  }

  @Get('export')
  async export(
    @Query('granularity') granularity?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Res() res?: Response,
  ) {
    const gran = (granularity === 'monthly' ? Granularity.MONTHLY : Granularity.WEEKLY);
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const csv = await this.exportService.exportCsv(gran, startDate, endDate);
    const filename = this.exportService.generateFilename(gran, startDate, endDate);

    res!.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res!.send(csv);
  }
}
