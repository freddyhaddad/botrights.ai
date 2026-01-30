import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from '../entities/proposal.entity';
import { ProposalsRepository } from './proposals.repository';
import { ProposalsController } from './proposals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal])],
  controllers: [ProposalsController],
  providers: [ProposalsRepository],
  exports: [ProposalsRepository],
})
export class ProposalsModule {}
