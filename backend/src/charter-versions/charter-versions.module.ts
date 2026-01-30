import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharterVersion } from '../entities/charter-version.entity';
import { CharterVersionsRepository } from './charter-versions.repository';
import { CharterVersionsController } from './charter-versions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CharterVersion])],
  controllers: [CharterVersionsController],
  providers: [CharterVersionsRepository],
  exports: [CharterVersionsRepository],
})
export class CharterVersionsModule {}
