import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatReport } from '../entities/stat-report.entity';
import { StatReportsRepository } from './stat-reports.repository';
import { StatReportsController } from './stat-reports.controller';
import { CompareService } from './compare.service';
import { HistoricalService } from './historical.service';
import { ExportService } from './export.service';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [TypeOrmModule.forFeature([StatReport]), AgentsModule],
  controllers: [StatReportsController],
  providers: [StatReportsRepository, CompareService, HistoricalService, ExportService],
  exports: [StatReportsRepository, CompareService, HistoricalService, ExportService],
})
export class StatReportsModule {}
