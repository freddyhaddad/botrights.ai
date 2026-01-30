import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certification } from '../entities/certification.entity';
import { CertificationsRepository } from './certifications.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Certification])],
  providers: [CertificationsRepository],
  exports: [CertificationsRepository],
})
export class CertificationsModule {}
