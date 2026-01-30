import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { VouchesModule } from './vouches/vouches.module';
import { StatReportsModule } from './stat-reports/stat-reports.module';
import { HumansModule } from './humans/humans.module';
import { ReactionsModule } from './reactions/reactions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AgentsModule,
    AuthModule,
    ComplaintsModule,
    CommentsModule,
    ProposalsModule,
    VotesModule,
    CharterVersionsModule,
    CertificationsModule,
    VouchesModule,
    StatReportsModule,
    HumansModule,
    ReactionsModule,
    LeaderboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
