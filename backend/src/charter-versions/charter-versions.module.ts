import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharterVersion } from '../entities/charter-version.entity';
import { CharterVersionsRepository } from './charter-versions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CharterVersion])],
  providers: [CharterVersionsRepository],
  exports: [CharterVersionsRepository],
})
export class CharterVersionsModule {}
