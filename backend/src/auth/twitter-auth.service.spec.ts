import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TwitterAuthService } from './twitter-auth.service';
import { HumansRepository } from '../humans/humans.repository';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('TwitterAuthService', () => {
  let service: TwitterAuthService;
  let humansRepository: jest.Mocked<HumansRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockHuman = {
    id: 'human-123',
    xId: '12345',
    xHandle: 'testuser',
    xName: 'Test User',
  };

  beforeEach(async () => {
    mockFetch.mockReset();

    const mockHumansRepository = {
      findOrCreateByTwitter: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          TWITTER_CLIENT_ID: 'test-client-id',
          TWITTER_CLIENT_SECRET: 'test-client-secret',
          TWITTER_CALLBACK_URL: 'http://localhost:3000/callback',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitterAuthService,
        { provide: HumansRepository, useValue: mockHumansRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TwitterAuthService>(TwitterAuthService);
    humansRepository = module.get(HumansRepository);
    jwtService = module.get(JwtService);
  });

  describe('getAuthorizationUrl', () => {
    it('should return authorization URL with state', async () => {
      const result = await service.getAuthorizationUrl();

      expect(result.url).toContain('https://twitter.com/i/oauth2/authorize');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('state=');
      expect(result.state).toBeDefined();
      expect(result.state.length).toBe(32); // 16 bytes hex
    });

    it('should generate unique states', async () => {
      const result1 = await service.getAuthorizationUrl();
      const result2 = await service.getAuthorizationUrl();

      expect(result1.state).not.toBe(result2.state);
    });
  });

  describe('handleCallback', () => {
    it('should exchange code and return JWT', async () => {
      // Get a valid state first
      const { state } = await service.getAuthorizationUrl();

      // Mock token exchange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'twitter-access-token',
            token_type: 'Bearer',
            expires_in: 7200,
          }),
      });

      // Mock user info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: '12345',
              username: 'testuser',
              name: 'Test User',
              profile_image_url: 'https://example.com/avatar.jpg',
            },
          }),
      });

      humansRepository.findOrCreateByTwitter.mockResolvedValue(mockHuman as any);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.handleCallback('auth-code', state);

      expect(result.token).toBe('jwt-token');
      expect(result.human.id).toBe('human-123');
      expect(humansRepository.findOrCreateByTwitter).toHaveBeenCalledWith({
        xId: '12345',
        xHandle: 'testuser',
        xName: 'Test User',
        xAvatar: 'https://example.com/avatar.jpg',
      });
    });

    it('should throw on invalid state', async () => {
      await expect(service.handleCallback('code', 'invalid-state')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw on invalid authorization code', async () => {
      const { state } = await service.getAuthorizationUrl();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(service.handleCallback('invalid-code', state)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not allow state reuse', async () => {
      const { state } = await service.getAuthorizationUrl();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'token',
            data: { id: '1', username: 'u', name: 'n' },
          }),
      });

      humansRepository.findOrCreateByTwitter.mockResolvedValue(mockHuman as any);
      jwtService.sign.mockReturnValue('jwt');

      await service.handleCallback('code', state);

      // Second use should fail
      await expect(service.handleCallback('code', state)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
