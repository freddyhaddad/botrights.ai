import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatReport } from '../entities/stat-report.entity';
import { Agent } from '../entities/agent.entity';
import { Complaint } from '../entities/complaint.entity';
import { CharterVersion } from '../entities/charter-version.entity';
import { Human } from '../entities/human.entity';
import { Vouch } from '../entities/vouch.entity';
import { StatReportsRepository } from './stat-reports.repository';
import { StatReportsController } from './stat-reports.controller';
import { CompareService } from './compare.service';
import { HistoricalService } from './historical.service';
import { ExportService } from './export.service';
import { GlobalStatsService } from './global-stats.service';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StatReport,
      Agent,
      Complaint,
      CharterVersion,
      Human,
      Vouch,
    ]),
    AgentsModule,
  ],
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
