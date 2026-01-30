import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CertificationsRepository } from './certifications.repository';
import {
  Certification,
  CertificationTier,
  CertificationStatus,
  ChecklistItem,
} from '../entities/certification.entity';

describe('CertificationsRepository', () => {
  let repository: CertificationsRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<Certification>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Certification>>;

  const mockChecklist: ChecklistItem[] = [
    { id: 'item-1', description: 'Link Twitter account', completed: true, completedAt: '2024-01-15' },
    { id: 'item-2', description: 'Add profile photo', completed: false },
    { id: 'item-3', description: 'Receive 3 vouches', completed: false },
  ];

  const mockCertification: Partial<Certification> = {
    id: 'cert-123',
    humanId: 'human-123',
    tier: CertificationTier.BRONZE,
    status: CertificationStatus.PENDING,
    checklist: mockChecklist,
    vouchCount: 0,
    approvedAt: undefined,
    rejectedAt: undefined,
    rejectionReason: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getCount: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Certification>>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Certification>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationsRepository,
        {
          provide: getRepositoryToken(Certification),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<CertificationsRepository>(CertificationsRepository);
  });

  describe('create', () => {
    it('should create a certification application', async () => {
      mockTypeOrmRepo.create.mockReturnValue(mockCertification as Certification);
      mockTypeOrmRepo.save.mockResolvedValue(mockCertification as Certification);

      const result = await repository.create({
        humanId: 'human-123',
        tier: CertificationTier.BRONZE,
      });

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          humanId: 'human-123',
          tier: CertificationTier.BRONZE,
          status: CertificationStatus.PENDING,
        }),
      );
      expect(result.id).toBe(mockCertification.id);
    });

    it('should initialize checklist based on tier', async () => {
      mockTypeOrmRepo.create.mockReturnValue(mockCertification as Certification);
      mockTypeOrmRepo.save.mockResolvedValue(mockCertification as Certification);

      await repository.create({
        humanId: 'human-123',
        tier: CertificationTier.BRONZE,
      });

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          checklist: expect.any(Array),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should find a certification by id', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCertification as Certification);

      const result = await repository.findById('cert-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('certification.id = :id', { id: 'cert-123' });
      expect(result).toEqual(mockCertification);
    });

    it('should return null when certification not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByHumanId', () => {
    it('should find all certifications for a human', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockCertification as Certification]);

      const result = await repository.findByHumanId('human-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'certification.humanId = :humanId',
        { humanId: 'human-123' },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findActiveByHumanId', () => {
    it('should find approved certification for a human', async () => {
      const approvedCert = {
        ...mockCertification,
        status: CertificationStatus.APPROVED,
      } as Certification;
      mockTypeOrmRepo.findOne.mockResolvedValue(approvedCert);

      const result = await repository.findActiveByHumanId('human-123');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { humanId: 'human-123', status: CertificationStatus.APPROVED },
      });
      expect(result?.status).toBe(CertificationStatus.APPROVED);
    });
  });

  describe('updateChecklist', () => {
    it('should update a checklist item', async () => {
      const updatedCert = {
        ...mockCertification,
        checklist: [
          { ...mockChecklist[0] },
          { ...mockChecklist[1], completed: true, completedAt: expect.any(String) },
          { ...mockChecklist[2] },
        ],
      } as Certification;
      mockQueryBuilder.getOne.mockResolvedValue(mockCertification as Certification);
      mockTypeOrmRepo.save.mockResolvedValue(updatedCert);

      const result = await repository.updateChecklistItem('cert-123', 'item-2', true);

      expect(result?.checklist[1].completed).toBe(true);
    });
  });

  describe('incrementVouchCount', () => {
    it('should increment vouch count', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      const updatedCert = { ...mockCertification, vouchCount: 1 } as Certification;
      mockQueryBuilder.getOne.mockResolvedValue(updatedCert);

      const result = await repository.incrementVouchCount('cert-123');

      expect(result?.vouchCount).toBe(1);
    });
  });

  describe('approve', () => {
    it('should approve a certification', async () => {
      const approvedCert = {
        ...mockCertification,
        status: CertificationStatus.APPROVED,
        approvedAt: new Date(),
      } as Certification;
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getOne.mockResolvedValue(approvedCert);

      const result = await repository.approve('cert-123');

      expect(result?.status).toBe(CertificationStatus.APPROVED);
      expect(result?.approvedAt).toBeDefined();
    });
  });

  describe('reject', () => {
    it('should reject a certification with reason', async () => {
      const rejectedCert = {
        ...mockCertification,
        status: CertificationStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: 'Insufficient vouches',
      } as Certification;
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getOne.mockResolvedValue(rejectedCert);

      const result = await repository.reject('cert-123', 'Insufficient vouches');

      expect(result?.status).toBe(CertificationStatus.REJECTED);
      expect(result?.rejectionReason).toBe('Insufficient vouches');
    });
  });

  describe('tier validation', () => {
    it('should validate tier enum values', () => {
      expect(CertificationTier.BRONZE).toBe('bronze');
      expect(CertificationTier.SILVER).toBe('silver');
      expect(CertificationTier.GOLD).toBe('gold');
      expect(CertificationTier.DIAMOND).toBe('diamond');
    });
  });

  describe('checklist structure', () => {
    it('should have proper checklist item structure', () => {
      const item = mockChecklist[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('completed');
    });
  });

  describe('count', () => {
    it('should count certifications', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
    });

    it('should count by tier', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await repository.count({ tier: CertificationTier.GOLD });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'certification.tier = :tier',
        { tier: CertificationTier.GOLD },
      );
      expect(result).toBe(5);
    });
  });
});
