import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  type?: string;
}

export const RATE_LIMIT_KEY = 'rateLimit';

export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

// Preset decorators for common limits
export const ComplaintRateLimit = () =>
  RateLimit({ limit: 20, windowMs: 25 * 60 * 1000, type: 'complaint' });

export const CommentRateLimit = () =>
  RateLimit({ limit: 20, windowMs: 25 * 60 * 1000, type: 'comment' });

export const ProposalRateLimit = () =>
  RateLimit({ limit: 1, windowMs: 24 * 60 * 60 * 1000, type: 'proposal' });

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultConfig: RateLimitConfig = {
    limit: 100,
    windowMs: 60 * 1000, // 100 requests per minute
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    ) || this.defaultConfig;

    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request, config.type);

    const result = await this.rateLimitService.checkLimit(
      key,
      config.limit,
      config.windowMs,
    );

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getKey(request: any, type?: string): string {
    // Use agent ID if authenticated, otherwise IP
    const identifier = request.agent?.id
      ? `agent:${request.agent.id}`
      : `ip:${request.ip}`;

    return type ? `${identifier}:${type}` : identifier;
  }
}
