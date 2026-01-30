import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatReport } from '../entities/stat-report.entity';
import { StatReportsRepository } from './stat-reports.repository';
import { StatReportsController } from './stat-reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatReport])],
  controllers: [StatReportsController],
  providers: [StatReportsRepository],
  exports: [StatReportsRepository],
})
export class StatReportsModule {}
