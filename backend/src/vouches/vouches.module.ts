import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vouch } from '../entities/vouch.entity';
import { VouchesRepository } from './vouches.repository';
import { VouchesController } from './vouches.controller';
import { CertificationsModule } from '../certifications/certifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vouch]),
    forwardRef(() => CertificationsModule),
  ],
  controllers: [VouchesController],
  providers: [VouchesRepository],
  exports: [VouchesRepository],
})
export class VouchesModule {}
