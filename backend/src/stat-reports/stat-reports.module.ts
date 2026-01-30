import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatReport } from '../entities/stat-report.entity';
import { StatReportsRepository } from './stat-reports.repository';
import { StatReportsController } from './stat-reports.controller';
import { CompareService } from './compare.service';
import { HistoricalService } from './historical.service';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [TypeOrmModule.forFeature([StatReport]), AgentsModule],
  controllers: [StatReportsController],
  providers: [StatReportsRepository, CompareService, HistoricalService],
  exports: [StatReportsRepository, CompareService, HistoricalService],
})
export class StatReportsModule {}
