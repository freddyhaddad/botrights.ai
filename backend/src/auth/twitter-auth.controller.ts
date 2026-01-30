import { Controller, Get, Query } from '@nestjs/common';
import { TwitterAuthService } from './twitter-auth.service';

interface CallbackQuery {
  code: string;
  state: string;
}

@Controller('api/v1/auth/twitter')
export class TwitterAuthController {
  constructor(private readonly twitterAuthService: TwitterAuthService) {}

  @Get('login')
  async login() {
    return this.twitterAuthService.getAuthorizationUrl();
  }

  @Get('callback')
  async callback(@Query() query: CallbackQuery) {
    return this.twitterAuthService.handleCallback(query.code, query.state);
  }
}
