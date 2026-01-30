import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentsRepository } from './comments.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Comment])],
  providers: [CommentsRepository],
  exports: [CommentsRepository],
})
export class CommentsModule {}
