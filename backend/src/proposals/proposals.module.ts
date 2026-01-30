import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from '../entities/proposal.entity';
import { ProposalsRepository } from './proposals.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal])],
  providers: [ProposalsRepository],
  exports: [ProposalsRepository],
})
export class ProposalsModule {}
