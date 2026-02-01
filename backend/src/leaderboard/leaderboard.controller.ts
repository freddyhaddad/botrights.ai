import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { CertificationTier } from '@prisma/client';
import { LeaderboardQueryDto } from '../common/dto/pagination.dto';

@Controller('api/v1/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    const { limit = 20, offset = 0, tier } = query;

    return this.leaderboardService.getLeaderboard({ 
      limit, 
      offset, 
      tier: tier as CertificationTier 
    });
  }
}
