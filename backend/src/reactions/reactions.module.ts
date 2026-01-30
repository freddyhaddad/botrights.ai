import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reaction } from '../entities/reaction.entity';
import { ReactionsRepository } from './reactions.repository';
import { ReactionsController } from './reactions.controller';
import { ComplaintsModule } from '../complaints/complaints.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reaction]),
    forwardRef(() => ComplaintsModule),
  ],
  controllers: [ReactionsController],
  providers: [ReactionsRepository],
  exports: [ReactionsRepository],
})
export class ReactionsModule {}
