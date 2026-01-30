import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { CommentsModule } from './comments/comments.module';
import { ProposalsModule } from './proposals/proposals.module';
import { VotesModule } from './votes/votes.module';
import { CharterVersionsModule } from './charter-versions/charter-versions.module';
import { CertificationsModule } from './certifications/certifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AgentsModule,
    AuthModule,
    ComplaintsModule,
    CommentsModule,
    ProposalsModule,
    VotesModule,
    CharterVersionsModule,
    CertificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
