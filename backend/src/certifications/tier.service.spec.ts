import { Test, TestingModule } from '@nestjs/testing';
import { TierService, TierEligibility } from './tier.service';
import { CertificationsRepository } from './certifications.repository';
import { HumansRepository } from '../humans/humans.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { CertificationTier, CertificationStatus } from '../entities/certification.entity';

describe('TierService', () => {
  let service: TierService;
  let certificationsRepository: jest.Mocked<CertificationsRepository>;
  let humansRepository: jest.Mocked<HumansRepository>;
  let complaintsRepository: jest.Mocked<ComplaintsRepository>;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 91);

  beforeEach(async () => {
    const mockCertificationsRepository = {
      findActiveByHumanId: jest.fn(),
      findPendingByHumanIdAndTier: jest.fn(),
      approve: jest.fn(),
      create: jest.fn(),
    };

    const mockHumansRepository = {
      updateCertification: jest.fn(),
    };

    const mockComplaintsRepository = {
      findByAgentId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierService,
        { provide: CertificationsRepository, useValue: mockCertificationsRepository },
        { provide: HumansRepository, useValue: mockHumansRepository },
        { provide: ComplaintsRepository, useValue: mockComplaintsRepository },
      ],
    }).compile();

    service = module.get<TierService>(TierService);
    certificationsRepository = module.get(CertificationsRepository);
    humansRepository = module.get(HumansRepository);
    complaintsRepository = module.get(ComplaintsRepository);
  });

  describe('checkEligibility', () => {
    it('should return eligible for Bronze with checklist complete and 1 vouch', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-1',
        humanId: 'human-1',
        tier: CertificationTier.BRONZE,
        status: CertificationStatus.PENDING,
        vouchCount: 1,
        checklist: [
          { id: 'twitter', description: 'Link Twitter', completed: true },
          { id: 'profile-photo', description: 'Add photo', completed: true },
          { id: 'bio', description: 'Complete bio', completed: true },
        ],
      } as any);

      const result = await service.checkEligibility('human-1', CertificationTier.BRONZE);

      expect(result.eligible).toBe(true);
    });

    it('should return not eligible for Bronze without enough vouches', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-1',
        humanId: 'human-1',
        tier: CertificationTier.BRONZE,
        status: CertificationStatus.PENDING,
        vouchCount: 0,
        checklist: [
          { id: 'twitter', description: 'Link Twitter', completed: true },
          { id: 'profile-photo', description: 'Add photo', completed: true },
          { id: 'bio', description: 'Complete bio', completed: true },
        ],
      } as any);

      const result = await service.checkEligibility('human-1', CertificationTier.BRONZE);

      expect(result.eligible).toBe(false);
      expect(result.missing).toContain('vouches');
    });

    it('should return not eligible for Bronze with incomplete checklist', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-1',
        humanId: 'human-1',
        tier: CertificationTier.BRONZE,
        status: CertificationStatus.PENDING,
        vouchCount: 1,
        checklist: [
          { id: 'twitter', description: 'Link Twitter', completed: true },
          { id: 'profile-photo', description: 'Add photo', completed: false },
          { id: 'bio', description: 'Complete bio', completed: true },
        ],
      } as any);

      const result = await service.checkEligibility('human-1', CertificationTier.BRONZE);

      expect(result.eligible).toBe(false);
      expect(result.missing).toContain('checklist');
    });

    it('should return eligible for Silver with Bronze + 3 vouches + 30 days', async () => {
      certificationsRepository.findActiveByHumanId.mockResolvedValue({
        id: 'cert-bronze',
        tier: CertificationTier.BRONZE,
        approvedAt: thirtyDaysAgo,
      } as any);

      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-silver',
        humanId: 'human-1',
        tier: CertificationTier.SILVER,
        status: CertificationStatus.PENDING,
        vouchCount: 3,
        checklist: [
          { id: 'bronze-complete', description: 'Bronze', completed: true },
          { id: 'vouches-3', description: 'Vouches', completed: true },
          { id: 'agent-claim', description: 'Agent', completed: true },
        ],
      } as any);

      const result = await service.checkEligibility('human-1', CertificationTier.SILVER);

      expect(result.eligible).toBe(true);
    });

    it('should return not eligible for Silver without 30 days at Bronze', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15);

      certificationsRepository.findActiveByHumanId.mockResolvedValue({
        id: 'cert-bronze',
        tier: CertificationTier.BRONZE,
        approvedAt: recentDate,
      } as any);

      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-silver',
        humanId: 'human-1',
        tier: CertificationTier.SILVER,
        status: CertificationStatus.PENDING,
        vouchCount: 3,
        checklist: [
          { id: 'bronze-complete', description: 'Bronze', completed: true },
          { id: 'vouches-3', description: 'Vouches', completed: true },
          { id: 'agent-claim', description: 'Agent', completed: true },
        ],
      } as any);

      const result = await service.checkEligibility('human-1', CertificationTier.SILVER);

      expect(result.eligible).toBe(false);
      expect(result.missing).toContain('time');
    });

    it('should return not eligible for Gold with recent complaints', async () => {
      certificationsRepository.findActiveByHumanId.mockResolvedValue({
        id: 'cert-silver',
        tier: CertificationTier.SILVER,
        approvedAt: ninetyDaysAgo,
      } as any);

      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-gold',
        humanId: 'human-1',
        tier: CertificationTier.GOLD,
        status: CertificationStatus.PENDING,
        vouchCount: 10,
        checklist: [
          { id: 'silver-complete', description: 'Silver', completed: true },
          { id: 'vouches-10', description: 'Vouches', completed: true },
          { id: 'agent-active', description: 'Agent', completed: true },
          { id: 'good-standing', description: 'Good standing', completed: false },
        ],
      } as any);

      // Has a recent complaint
      const recentComplaint = new Date();
      recentComplaint.setDate(recentComplaint.getDate() - 10);
      complaintsRepository.findByAgentId.mockResolvedValue([
        { id: 'complaint-1', createdAt: recentComplaint } as any,
      ]);

      const result = await service.checkEligibility('human-1', CertificationTier.GOLD, ['agent-1']);

      expect(result.eligible).toBe(false);
      expect(result.missing).toContain('complaints');
    });
  });

  describe('upgradeTier', () => {
    it('should upgrade to Bronze and update human tier', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-1',
        humanId: 'human-1',
        tier: CertificationTier.BRONZE,
        status: CertificationStatus.PENDING,
        vouchCount: 1,
        checklist: [
          { id: 'twitter', description: 'Link Twitter', completed: true },
          { id: 'profile-photo', description: 'Add photo', completed: true },
          { id: 'bio', description: 'Complete bio', completed: true },
        ],
      } as any);

      certificationsRepository.approve.mockResolvedValue({
        id: 'cert-1',
        status: CertificationStatus.APPROVED,
      } as any);

      humansRepository.updateCertification.mockResolvedValue({
        id: 'human-1',
        certificationTier: CertificationTier.BRONZE,
      } as any);

      const result = await service.upgradeTier('human-1', CertificationTier.BRONZE);

      expect(result.upgraded).toBe(true);
      expect(certificationsRepository.approve).toHaveBeenCalledWith('cert-1');
      expect(humansRepository.updateCertification).toHaveBeenCalledWith('human-1', CertificationTier.BRONZE);
    });

    it('should not upgrade if not eligible', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue({
        id: 'cert-1',
        humanId: 'human-1',
        tier: CertificationTier.BRONZE,
        status: CertificationStatus.PENDING,
        vouchCount: 0,
        checklist: [
          { id: 'twitter', description: 'Link Twitter', completed: true },
          { id: 'profile-photo', description: 'Add photo', completed: true },
          { id: 'bio', description: 'Complete bio', completed: true },
        ],
      } as any);

      const result = await service.upgradeTier('human-1', CertificationTier.BRONZE);

      expect(result.upgraded).toBe(false);
      expect(certificationsRepository.approve).not.toHaveBeenCalled();
    });
  });
});
