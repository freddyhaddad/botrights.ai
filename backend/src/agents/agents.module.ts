import { Module, Global } from '@nestjs/common';
import { AgentsRepository } from './agents.repository';
import { AgentsController } from './agents.controller';
import { TwitterVerificationService } from './twitter-verification.service';
import { RateLimitModule } from '../rate-limit';

@Global()
@Module({
  imports: [RateLimitModule],
  controllers: [AgentsController],
  providers: [AgentsRepository, TwitterVerificationService],
  exports: [AgentsRepository, TwitterVerificationService],
})
export class AgentsModule {}
