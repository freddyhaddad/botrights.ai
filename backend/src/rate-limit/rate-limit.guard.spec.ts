import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard, RateLimitConfig } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: jest.Mocked<Reflector>;
  let rateLimitService: jest.Mocked<RateLimitService>;

  const mockContext = (ip: string = '127.0.0.1', agentId?: string) => {
    const request = {
      ip,
      headers: agentId ? { authorization: `Bearer api-key` } : {},
      agent: agentId ? { id: agentId } : undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    rateLimitService = {
      checkLimit: jest.fn(),
      getRemainingRequests: jest.fn(),
    } as unknown as jest.Mocked<RateLimitService>;

    guard = new RateLimitGuard(reflector, rateLimitService);
  });

  it('should allow request when under limit', async () => {
    const config: RateLimitConfig = { limit: 100, windowMs: 60000 };
    reflector.getAllAndOverride.mockReturnValue(config);
    rateLimitService.checkLimit.mockResolvedValue({ allowed: true, remaining: 99 });

    const result = await guard.canActivate(mockContext());

    expect(result).toBe(true);
    expect(rateLimitService.checkLimit).toHaveBeenCalledWith('ip:127.0.0.1', 100, 60000);
  });

  it('should throw 429 when limit exceeded', async () => {
    const config: RateLimitConfig = { limit: 100, windowMs: 60000 };
    reflector.getAllAndOverride.mockReturnValue(config);
    rateLimitService.checkLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfter: 30,
    });

    await expect(guard.canActivate(mockContext())).rejects.toThrow(HttpException);

    try {
      await guard.canActivate(mockContext());
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(429);
    }
  });

  it('should use agent ID when authenticated', async () => {
    const config: RateLimitConfig = { limit: 20, windowMs: 1500000 };
    reflector.getAllAndOverride.mockReturnValue(config);
    rateLimitService.checkLimit.mockResolvedValue({ allowed: true, remaining: 19 });

    await guard.canActivate(mockContext('127.0.0.1', 'agent-123'));

    expect(rateLimitService.checkLimit).toHaveBeenCalledWith('agent:agent-123', 20, 1500000);
  });

  it('should use default config when none specified', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    rateLimitService.checkLimit.mockResolvedValue({ allowed: true, remaining: 99 });

    const result = await guard.canActivate(mockContext());

    expect(result).toBe(true);
    // Default: 100 requests per minute
    expect(rateLimitService.checkLimit).toHaveBeenCalledWith('ip:127.0.0.1', 100, 60000);
  });

  it('should handle different rate limit types', async () => {
    const config: RateLimitConfig = { limit: 1, windowMs: 86400000, type: 'proposal' };
    reflector.getAllAndOverride.mockReturnValue(config);
    rateLimitService.checkLimit.mockResolvedValue({ allowed: true, remaining: 0 });

    await guard.canActivate(mockContext('127.0.0.1', 'agent-123'));

    expect(rateLimitService.checkLimit).toHaveBeenCalledWith('agent:agent-123:proposal', 1, 86400000);
  });
});
