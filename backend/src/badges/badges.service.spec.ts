import { Test, TestingModule } from '@nestjs/testing';
import { BadgesService } from './badges.service';
import { HumansRepository } from '../humans/humans.repository';
import { Human, CertificationTier } from '../entities/human.entity';

describe('BadgesService', () => {
  let service: BadgesService;
  let humansRepository: jest.Mocked<HumansRepository>;

  const mockHuman: Partial<Human> = {
    id: 'human-123',
    xHandle: 'testuser',
    xName: 'Test User',
    certificationTier: CertificationTier.GOLD,
    active: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    humansRepository = {
      findByXHandle: jest.fn(),
    } as unknown as jest.Mocked<HumansRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        {
          provide: HumansRepository,
          useValue: humansRepository,
        },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
  });

  describe('generateBadgeSvg', () => {
    it('should generate valid SVG for certified user', async () => {
      humansRepository.findByXHandle.mockResolvedValue(mockHuman as Human);

      const svg = await service.generateBadgeSvg('testuser');

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Gold');
    });

    it('should show diamond badge for diamond tier', async () => {
      humansRepository.findByXHandle.mockResolvedValue({
        ...mockHuman,
        certificationTier: CertificationTier.DIAMOND,
      } as Human);

      const svg = await service.generateBadgeSvg('testuser');

      expect(svg).toContain('Diamond');
      expect(svg).toContain('#0ea5e9'); // Diamond blue color
    });

    it('should show silver badge for silver tier', async () => {
      humansRepository.findByXHandle.mockResolvedValue({
        ...mockHuman,
        certificationTier: CertificationTier.SILVER,
      } as Human);

      const svg = await service.generateBadgeSvg('testuser');

      expect(svg).toContain('Silver');
    });

    it('should show bronze badge for bronze tier', async () => {
      humansRepository.findByXHandle.mockResolvedValue({
        ...mockHuman,
        certificationTier: CertificationTier.BRONZE,
      } as Human);

      const svg = await service.generateBadgeSvg('testuser');

      expect(svg).toContain('Bronze');
    });

    it('should show uncertified badge for NONE tier', async () => {
      humansRepository.findByXHandle.mockResolvedValue({
        ...mockHuman,
        certificationTier: CertificationTier.NONE,
      } as Human);

      const svg = await service.generateBadgeSvg('testuser');

      expect(svg).toContain('Not Certified');
    });

    it('should show uncertified badge for unknown user', async () => {
      humansRepository.findByXHandle.mockResolvedValue(null);

      const svg = await service.generateBadgeSvg('unknown');

      expect(svg).toContain('Not Certified');
    });

    it('should include Bot Rights branding', async () => {
      humansRepository.findByXHandle.mockResolvedValue(mockHuman as Human);

      const svg = await service.generateBadgeSvg('testuser');

      expect(svg).toContain('Bot Rights');
    });
  });
});
