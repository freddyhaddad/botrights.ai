import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { CertificationTier } from '@prisma/client';

@Controller('api/v1/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('tier') tier?: CertificationTier,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    if (isNaN(offset) || offset < 0) {
      throw new BadRequestException('Offset must be a non-negative number');
    }

    if (tier && !Object.values(CertificationTier).includes(tier)) {
      throw new BadRequestException('Invalid tier');
    }

    return this.leaderboardService.getLeaderboard({ limit, offset, tier });
  }
}
