import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentsRepository } from './comments.repository';
import { CommentsController } from './comments.controller';
import { ComplaintsModule } from '../complaints/complaints.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    forwardRef(() => ComplaintsModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsRepository],
  exports: [CommentsRepository],
})
export class CommentsModule {}
