import { Module, forwardRef } from '@nestjs/common';
import { ProposalsRepository } from './proposals.repository';
import { ProposalsController } from './proposals.controller';
import { RatificationService } from './ratification.service';
import { ExpirationService } from './expiration.service';
import { CharterVersionsModule } from '../charter-versions/charter-versions.module';

@Module({
  imports: [forwardRef(() => CharterVersionsModule)],
  controllers: [ProposalsController],
  providers: [ProposalsRepository, RatificationService, ExpirationService],
  exports: [ProposalsRepository, RatificationService, ExpirationService],
})
export class ProposalsModule {}
