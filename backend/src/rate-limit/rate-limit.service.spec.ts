import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    service = new RateLimitService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkLimit', () => {
    it('should allow first request', async () => {
      const result = await service.checkLimit('test-key', 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track requests within window', async () => {
      await service.checkLimit('test-key', 10, 60000);
      await service.checkLimit('test-key', 10, 60000);
      const result = await service.checkLimit('test-key', 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
    });

    it('should block when limit exceeded', async () => {
      for (let i = 0; i < 10; i++) {
        await service.checkLimit('test-key', 10, 60000);
      }

      const result = await service.checkLimit('test-key', 10, 60000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', async () => {
      for (let i = 0; i < 10; i++) {
        await service.checkLimit('test-key', 10, 60000);
      }

      // Advance time past window
      jest.advanceTimersByTime(61000);

      const result = await service.checkLimit('test-key', 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track different keys separately', async () => {
      for (let i = 0; i < 10; i++) {
        await service.checkLimit('key-1', 10, 60000);
      }

      const result = await service.checkLimit('key-2', 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should calculate correct retryAfter', async () => {
      for (let i = 0; i < 10; i++) {
        await service.checkLimit('test-key', 10, 60000);
      }

      jest.advanceTimersByTime(30000); // 30 seconds

      const result = await service.checkLimit('test-key', 10, 60000);

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeLessThanOrEqual(30);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return limit for new key', async () => {
      const result = await service.getRemainingRequests('new-key', 100);

      expect(result).toBe(100);
    });

    it('should return correct remaining after requests', async () => {
      await service.checkLimit('test-key', 100, 60000);
      await service.checkLimit('test-key', 100, 60000);
      await service.checkLimit('test-key', 100, 60000);

      const result = await service.getRemainingRequests('test-key', 100);

      expect(result).toBe(97);
    });
  });
});
