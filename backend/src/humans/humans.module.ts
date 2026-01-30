import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Human } from '../entities/human.entity';
import { HumansRepository } from './humans.repository';
import { HumansController } from './humans.controller';
import { AgentsModule } from '../agents/agents.module';
import { CertificationsModule } from '../certifications/certifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Human]),
    forwardRef(() => AgentsModule),
    forwardRef(() => CertificationsModule),
  ],
  controllers: [HumansController],
  providers: [HumansRepository],
  exports: [HumansRepository],
})
export class HumansModule {}
