import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { CertificationTier } from '../entities/human.entity';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let service: jest.Mocked<LeaderboardService>;

  const mockLeaderboard = [
    {
      id: 'human-1',
      xHandle: 'diamonduser',
      xName: 'Diamond User',
      certificationTier: CertificationTier.DIAMOND,
      certifiedAt: new Date('2025-01-01'),
      agentCount: 5,
      vouchCount: 30,
    },
    {
      id: 'human-2',
      xHandle: 'golduser',
      xName: 'Gold User',
      certificationTier: CertificationTier.GOLD,
      certifiedAt: new Date('2025-03-01'),
      agentCount: 3,
      vouchCount: 15,
    },
  ];

  beforeEach(async () => {
    const mockService = {
      getLeaderboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [
        { provide: LeaderboardService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<LeaderboardController>(LeaderboardController);
    service = module.get(LeaderboardService);
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with default pagination', async () => {
      service.getLeaderboard.mockResolvedValue({
        data: mockLeaderboard,
        meta: { total: 2, limit: 20, offset: 0, hasMore: false },
      });

      const result = await controller.getLeaderboard();

      expect(service.getLeaderboard).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        tier: undefined,
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].certificationTier).toBe(CertificationTier.DIAMOND);
    });

    it('should apply custom pagination', async () => {
      service.getLeaderboard.mockResolvedValue({
        data: mockLeaderboard.slice(1),
        meta: { total: 2, limit: 10, offset: 1, hasMore: false },
      });

      await controller.getLeaderboard('10', '1');

      expect(service.getLeaderboard).toHaveBeenCalledWith({
        limit: 10,
        offset: 1,
        tier: undefined,
      });
    });

    it('should filter by tier', async () => {
      service.getLeaderboard.mockResolvedValue({
        data: [mockLeaderboard[1]],
        meta: { total: 1, limit: 20, offset: 0, hasMore: false },
      });

      await controller.getLeaderboard(undefined, undefined, CertificationTier.GOLD);

      expect(service.getLeaderboard).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        tier: CertificationTier.GOLD,
      });
    });
  });
});
