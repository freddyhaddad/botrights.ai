import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Human } from '../entities/human.entity';
import { HumansRepository } from './humans.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Human])],
  providers: [HumansRepository],
  exports: [HumansRepository],
})
export class HumansModule {}
