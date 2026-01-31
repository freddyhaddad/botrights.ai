import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { HumansRepository } from '../humans/humans.repository';
import { Human } from '@prisma/client';

interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

interface TwitterUserResponse {
  data: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
  };
}

@Injectable()
export class TwitterAuthService {
  private states = new Map<string, { createdAt: Date }>();
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly humansRepository: HumansRepository,
  ) {
    this.clientId = this.configService.get<string>('TWITTER_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('TWITTER_CLIENT_SECRET') || '';
    this.callbackUrl = this.configService.get<string>('TWITTER_CALLBACK_URL') ||
      'http://localhost:3000/api/v1/auth/twitter/callback';
  }

  async getAuthorizationUrl(): Promise<{ url: string; state: string }> {
    const state = randomBytes(16).toString('hex');
    this.states.set(state, { createdAt: new Date() });

    // Clean old states (older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    for (const [key, value] of this.states.entries()) {
      if (value.createdAt < tenMinutesAgo) {
        this.states.delete(key);
      }
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'users.read tweet.read',
      state,
      code_challenge: 'challenge',
      code_challenge_method: 'plain',
    });

    return {
      url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
      state,
    };
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ token: string; human: Human }> {
    // Validate state
    if (!this.states.has(state)) {
      throw new UnauthorizedException('Invalid state parameter');
    }
    this.states.delete(state);

    // Exchange code for token
    const tokenResponse = await this.exchangeCodeForToken(code);

    // Get user info from Twitter
    const userInfo = await this.getTwitterUser(tokenResponse.access_token);

    // Find or create human
    const human = await this.humansRepository.findOrCreateByTwitter({
      xId: userInfo.data.id,
      xHandle: userInfo.data.username,
      xName: userInfo.data.name,
      xAvatar: userInfo.data.profile_image_url,
    });

    // Generate JWT
    const token = this.jwtService.sign({
      sub: human.id,
      xId: human.xId,
      xHandle: human.xHandle,
    });

    return { token, human };
  }

  private async exchangeCodeForToken(code: string): Promise<TwitterTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.callbackUrl,
      code_verifier: 'challenge',
    });

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    return response.json();
  }

  private async getTwitterUser(accessToken: string): Promise<TwitterUserResponse> {
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to get user info');
    }

    return response.json();
  }

  /**
   * Exchange Twitter OAuth data from NextAuth for a backend JWT.
   * This is called by the frontend after NextAuth handles the OAuth flow.
   */
  async exchangeTokenFromNextAuth(data: {
    accessToken: string;
    twitterId: string;
    username: string;
    name: string;
    image?: string;
  }): Promise<{ token: string; humanId: string; username: string }> {
    // Find or create human based on the Twitter data from NextAuth
    const human = await this.humansRepository.findOrCreateByTwitter({
      xId: data.twitterId,
      xHandle: data.username,
      xName: data.name,
      xAvatar: data.image,
    });

    // Generate JWT
    const token = this.jwtService.sign({
      sub: human.id,
      xId: human.xId,
      xHandle: human.xHandle,
    });

    return { token, humanId: human.id, username: human.xHandle };
  }
}
