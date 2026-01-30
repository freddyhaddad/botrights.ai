import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintsRepository } from './complaints.repository';
import { ComplaintsController } from './complaints.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint]),
    AuthModule,
  ],
  controllers: [ComplaintsController],
  providers: [ComplaintsRepository],
  exports: [ComplaintsRepository],
})
export class ComplaintsModule {}
