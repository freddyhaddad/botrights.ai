import { Module, forwardRef } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CommentsController } from './comments.controller';
import { ComplaintsModule } from '../complaints/complaints.module';

@Module({
  imports: [forwardRef(() => ComplaintsModule)],
  controllers: [CommentsController],
  providers: [CommentsRepository],
  exports: [CommentsRepository],
})
export class CommentsModule {}
