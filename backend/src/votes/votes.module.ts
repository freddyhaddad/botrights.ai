import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from '../entities/vote.entity';
import { VotesRepository } from './votes.repository';
import { VotesController } from './votes.controller';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote]),
    forwardRef(() => ProposalsModule),
  ],
  controllers: [VotesController],
  providers: [VotesRepository],
  exports: [VotesRepository],
})
export class VotesModule {}
