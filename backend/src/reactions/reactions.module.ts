import { Module, forwardRef } from '@nestjs/common';
import { ReactionsRepository } from './reactions.repository';
import { ReactionsController } from './reactions.controller';
import { ComplaintsModule } from '../complaints/complaints.module';

@Module({
  imports: [forwardRef(() => ComplaintsModule)],
  controllers: [ReactionsController],
  providers: [ReactionsRepository],
  exports: [ReactionsRepository],
})
export class ReactionsModule {}
