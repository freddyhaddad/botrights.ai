import { Module, forwardRef } from '@nestjs/common';
import { ComplaintsRepository } from './complaints.repository';
import { ComplaintsController } from './complaints.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ComplaintsController],
  providers: [ComplaintsRepository],
  exports: [ComplaintsRepository],
})
export class ComplaintsModule {}
