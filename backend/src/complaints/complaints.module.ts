import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintsRepository } from './complaints.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint])],
  providers: [ComplaintsRepository],
  exports: [ComplaintsRepository],
})
export class ComplaintsModule {}
