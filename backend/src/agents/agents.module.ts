import { Module, Global } from '@nestjs/common';
import { AgentsRepository } from './agents.repository';
import { AgentsController } from './agents.controller';
import { TwitterVerificationService } from './twitter-verification.service';

@Global()
@Module({
  controllers: [AgentsController],
  providers: [AgentsRepository, TwitterVerificationService],
  exports: [AgentsRepository, TwitterVerificationService],
})
export class AgentsModule {}
