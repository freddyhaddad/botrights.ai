import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { TwitterAuthService } from './twitter-auth.service';

interface CallbackQuery {
  code: string;
  state: string;
}

interface TokenExchangeBody {
  accessToken: string;
  twitterId: string;
  username: string;
  name: string;
  image?: string;
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

  /**
   * Exchange Twitter OAuth tokens for a backend JWT.
   * Called by NextAuth after successful Twitter OAuth.
   */
  @Post('token')
  async exchangeToken(@Body() body: TokenExchangeBody) {
    return this.twitterAuthService.exchangeTokenFromNextAuth(body);
  }
}
