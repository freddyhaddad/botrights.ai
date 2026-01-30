import { Test, TestingModule } from '@nestjs/testing';
import { CertificationsController } from './certifications.controller';
import { CertificationsRepository } from './certifications.repository';
import { BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { Certification, CertificationTier, CertificationStatus } from '../entities/certification.entity';
import { Human } from '../entities/human.entity';

describe('CertificationsController', () => {
  let controller: CertificationsController;
  let repository: jest.Mocked<CertificationsRepository>;

  const mockHuman: Partial<Human> = {
    id: 'human-123',
    xHandle: 'testuser',
    xName: 'Test User',
  };

  const mockCertification: Partial<Certification> = {
    id: 'cert-123',
    humanId: 'human-123',
    tier: CertificationTier.BRONZE,
    status: CertificationStatus.PENDING,
    checklist: [
      { id: 'twitter', description: 'Link Twitter/X account', completed: false },
      { id: 'profile-photo', description: 'Add profile photo', completed: false },
      { id: 'bio', description: 'Complete bio', completed: false },
    ],
    vouchCount: 0,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findByHumanId: jest.fn(),
      findPendingByHumanIdAndTier: jest.fn(),
      findActiveByHumanId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificationsController],
      providers: [
        { provide: CertificationsRepository, useValue: mockRepository },
      ],
    }).compile();

    controller = module.get<CertificationsController>(CertificationsController);
    repository = module.get(CertificationsRepository);
  });

  describe('apply', () => {
    it('should create certification application', async () => {
      repository.findPendingByHumanIdAndTier.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCertification as Certification);

      const result = await controller.apply(
        { tier: CertificationTier.BRONZE },
        mockHuman as Human,
      );

      expect(repository.create).toHaveBeenCalledWith({
        humanId: 'human-123',
        tier: CertificationTier.BRONZE,
      });
      expect(result.status).toBe(CertificationStatus.PENDING);
    });

    it('should throw UnauthorizedException when human not provided', async () => {
      await expect(
        controller.apply({ tier: CertificationTier.BRONZE }, undefined as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException when pending application exists', async () => {
      repository.findPendingByHumanIdAndTier.mockResolvedValue(mockCertification as Certification);

      await expect(
        controller.apply({ tier: CertificationTier.BRONZE }, mockHuman as Human),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when tier is invalid', async () => {
      await expect(
        controller.apply({ tier: 'invalid' as CertificationTier }, mockHuman as Human),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when applying for NONE tier', async () => {
      await expect(
        controller.apply({ tier: CertificationTier.NONE }, mockHuman as Human),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyApplications', () => {
    it('should return human certifications', async () => {
      repository.findByHumanId.mockResolvedValue([mockCertification as Certification]);

      const result = await controller.getMyApplications(mockHuman as Human);

      expect(repository.findByHumanId).toHaveBeenCalledWith('human-123');
      expect(result).toHaveLength(1);
    });

    it('should throw UnauthorizedException when human not provided', async () => {
      await expect(controller.getMyApplications(undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
