import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from '../entities/vote.entity';
import { VotesRepository } from './votes.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Vote])],
  providers: [VotesRepository],
  exports: [VotesRepository],
})
export class VotesModule {}
