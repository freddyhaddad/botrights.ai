import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AgentsModule } from '../agents/agents.module';
import { HumansModule } from '../humans/humans.module';
import { ApiKeyGuard } from './guards/api-key.guard';
import { TwitterAuthController } from './twitter-auth.controller';
import { TwitterAuthService } from './twitter-auth.service';

@Module({
  imports: [
    AgentsModule,
    HumansModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-secret',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TwitterAuthController],
  providers: [ApiKeyGuard, TwitterAuthService],
  exports: [ApiKeyGuard, TwitterAuthService],
})
export class AuthModule {}
