import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certification } from '../entities/certification.entity';
import { CertificationsRepository } from './certifications.repository';
import { CertificationsController } from './certifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Certification])],
  controllers: [CertificationsController],
  providers: [CertificationsRepository],
  exports: [CertificationsRepository],
})
export class CertificationsModule {}
