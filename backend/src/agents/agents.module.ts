import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../entities/agent.entity';
import { AgentsRepository } from './agents.repository';
import { AgentsController } from './agents.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Agent])],
  controllers: [AgentsController],
  providers: [AgentsRepository],
  exports: [AgentsRepository],
})
export class AgentsModule {}
