import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [AgentsModule],
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
