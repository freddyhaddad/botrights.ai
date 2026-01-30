import { Test, TestingModule } from '@nestjs/testing';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

describe('BadgesController', () => {
  let controller: BadgesController;
  let service: jest.Mocked<BadgesService>;

  const mockSvg = '<svg>Mock Badge</svg>';

  beforeEach(async () => {
    service = {
      generateBadgeSvg: jest.fn(),
    } as unknown as jest.Mocked<BadgesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgesController],
      providers: [
        {
          provide: BadgesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BadgesController>(BadgesController);
  });

  describe('getBadge', () => {
    it('should return SVG content', async () => {
      service.generateBadgeSvg.mockResolvedValue(mockSvg);

      const result = await controller.getBadge('testuser');

      expect(result).toBe(mockSvg);
      expect(service.generateBadgeSvg).toHaveBeenCalledWith('testuser');
    });

    it('should strip .svg extension from username', async () => {
      service.generateBadgeSvg.mockResolvedValue(mockSvg);

      await controller.getBadge('testuser.svg');

      expect(service.generateBadgeSvg).toHaveBeenCalledWith('testuser');
    });
  });
});
