import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../entities/agent.entity';
import { Human } from '../entities/human.entity';
import { AgentsRepository } from './agents.repository';
import { AgentsController } from './agents.controller';
import { TwitterVerificationService } from './twitter-verification.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Agent, Human])],
  controllers: [AgentsController],
  providers: [AgentsRepository, TwitterVerificationService],
  exports: [AgentsRepository, TwitterVerificationService],
})
export class AgentsModule {}
