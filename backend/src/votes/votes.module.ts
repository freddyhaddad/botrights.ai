import { Module, forwardRef } from '@nestjs/common';
import { VotesRepository } from './votes.repository';
import { VotesController } from './votes.controller';
import { ProposalsModule } from '../proposals/proposals.module';

@Module({
  imports: [forwardRef(() => ProposalsModule)],
  controllers: [VotesController],
  providers: [VotesRepository],
  exports: [VotesRepository],
})
export class VotesModule {}
