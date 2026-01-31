import { Module, forwardRef } from '@nestjs/common';
import { VouchesRepository } from './vouches.repository';
import { VouchesController } from './vouches.controller';
import { CertificationsModule } from '../certifications/certifications.module';

@Module({
  imports: [forwardRef(() => CertificationsModule)],
  controllers: [VouchesController],
  providers: [VouchesRepository],
  exports: [VouchesRepository],
})
export class VouchesModule {}
