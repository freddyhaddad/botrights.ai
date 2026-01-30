import { Test, TestingModule } from '@nestjs/testing';
import { TwitterAuthController } from './twitter-auth.controller';
import { TwitterAuthService } from './twitter-auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('TwitterAuthController', () => {
  let controller: TwitterAuthController;
  let service: jest.Mocked<TwitterAuthService>;

  const mockHuman = {
    id: 'human-123',
    xId: '12345',
    xHandle: 'testuser',
    xName: 'Test User',
  };

  beforeEach(async () => {
    const mockService = {
      getAuthorizationUrl: jest.fn(),
      handleCallback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwitterAuthController],
      providers: [
        {
          provide: TwitterAuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TwitterAuthController>(TwitterAuthController);
    service = module.get(TwitterAuthService);
  });

  describe('login', () => {
    it('should return authorization URL', async () => {
      const authUrl = 'https://twitter.com/oauth/authorize?...';
      service.getAuthorizationUrl.mockResolvedValue({
        url: authUrl,
        state: 'random-state',
      });

      const result = await controller.login();

      expect(result.url).toBe(authUrl);
      expect(result.state).toBeDefined();
    });
  });

  describe('callback', () => {
    it('should exchange code for token and return JWT', async () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      service.handleCallback.mockResolvedValue({
        token: jwt,
        human: mockHuman as any,
      });

      const result = await controller.callback({
        code: 'auth-code',
        state: 'random-state',
      });

      expect(service.handleCallback).toHaveBeenCalledWith('auth-code', 'random-state');
      expect(result.token).toBe(jwt);
      expect(result.human.id).toBe('human-123');
    });

    it('should throw when code is invalid', async () => {
      service.handleCallback.mockRejectedValue(
        new UnauthorizedException('Invalid authorization code'),
      );

      await expect(
        controller.callback({ code: 'invalid', state: 'state' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when state is invalid', async () => {
      service.handleCallback.mockRejectedValue(
        new UnauthorizedException('Invalid state parameter'),
      );

      await expect(
        controller.callback({ code: 'code', state: 'wrong-state' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
