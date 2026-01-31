import { Module } from '@nestjs/common';
import { StatReportsRepository } from './stat-reports.repository';
import { StatReportsController } from './stat-reports.controller';
import { CompareService } from './compare.service';
import { HistoricalService } from './historical.service';
import { ExportService } from './export.service';
import { GlobalStatsService } from './global-stats.service';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [StatReportsController],
  providers: [
    StatReportsRepository,
    CompareService,
    HistoricalService,
    ExportService,
    GlobalStatsService,
  ],
  exports: [
    StatReportsRepository,
    CompareService,
    HistoricalService,
    ExportService,
    GlobalStatsService,
  ],
})
export class StatReportsModule {}
