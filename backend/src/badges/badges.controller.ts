import { Controller, Get, Param, Header } from '@nestjs/common';
import { BadgesService } from './badges.service';

@Controller('api/v1/badge')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get(':username')
  @Header('Content-Type', 'image/svg+xml')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  async getBadge(@Param('username') username: string): Promise<string> {
    // Strip .svg extension if present
    const cleanUsername = username.replace(/\.svg$/, '');
    return this.badgesService.generateBadgeSvg(cleanUsername);
  }
}
