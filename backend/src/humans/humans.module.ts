import { Module, forwardRef } from '@nestjs/common';
import { HumansRepository } from './humans.repository';
import { HumansController } from './humans.controller';
import { AgentsModule } from '../agents/agents.module';
import { CertificationsModule } from '../certifications/certifications.module';

@Module({
  imports: [forwardRef(() => AgentsModule), forwardRef(() => CertificationsModule)],
  controllers: [HumansController],
  providers: [HumansRepository],
  exports: [HumansRepository],
})
export class HumansModule {}
