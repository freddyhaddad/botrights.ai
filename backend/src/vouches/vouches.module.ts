import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vouch } from '../entities/vouch.entity';
import { VouchesRepository } from './vouches.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Vouch])],
  providers: [VouchesRepository],
  exports: [VouchesRepository],
})
export class VouchesModule {}
