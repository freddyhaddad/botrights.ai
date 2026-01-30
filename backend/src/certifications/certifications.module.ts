import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certification } from '../entities/certification.entity';
import { CertificationsRepository } from './certifications.repository';
import { CertificationsController } from './certifications.controller';
import { TierService } from './tier.service';
import { HumansModule } from '../humans/humans.module';
import { ComplaintsModule } from '../complaints/complaints.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certification]),
    forwardRef(() => HumansModule),
    forwardRef(() => ComplaintsModule),
  ],
  controllers: [CertificationsController],
  providers: [CertificationsRepository, TierService],
  exports: [CertificationsRepository, TierService],
})
export class CertificationsModule {}
