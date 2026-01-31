import { Module } from '@nestjs/common';
import { CharterVersionsRepository } from './charter-versions.repository';
import { CharterVersionsController } from './charter-versions.controller';

@Module({
  controllers: [CharterVersionsController],
  providers: [CharterVersionsRepository],
  exports: [CharterVersionsRepository],
})
export class CharterVersionsModule {}
