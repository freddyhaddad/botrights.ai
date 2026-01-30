import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatReport } from '../entities/stat-report.entity';
import { StatReportsRepository } from './stat-reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StatReport])],
  providers: [StatReportsRepository],
  exports: [StatReportsRepository],
})
export class StatReportsModule {}
