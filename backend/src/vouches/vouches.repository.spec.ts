import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { VouchesRepository, VouchError } from './vouches.repository';
import { Vouch } from '../entities/vouch.entity';

describe('VouchesRepository', () => {
  let repository: VouchesRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<Vouch>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Vouch>>;

  const mockVouch: Partial<Vouch> = {
    id: 'vouch-123',
    voucherId: 'human-123',
    agentId: 'agent-456',
    endorsement: 'Great human who treats their agent well!',
    rating: 5,
    isActive: true,
    withdrawnAt: undefined,
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
    } as unknown as jest.Mocked<SelectQueryBuilder<Vouch>>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Vouch>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchesRepository,
        {
          provide: getRepositoryToken(Vouch),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<VouchesRepository>(VouchesRepository);
  });

  describe('create', () => {
    it('should create a vouch with valid data', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.create.mockReturnValue(mockVouch as Vouch);
      mockTypeOrmRepo.save.mockResolvedValue(mockVouch as Vouch);

      const result = await repository.create({
        voucherId: 'human-123',
        agentId: 'agent-456',
        endorsement: 'Great human!',
        rating: 5,
      });

      expect(result.vouch).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error when already vouched', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockVouch as Vouch);

      const result = await repository.create({
        voucherId: 'human-123',
        agentId: 'agent-456',
        rating: 5,
      });

      expect(result.vouch).toBeUndefined();
      expect(result.error).toBe(VouchError.ALREADY_VOUCHED);
    });

    it('should return error for invalid rating', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.create({
        voucherId: 'human-123',
        agentId: 'agent-456',
        rating: 6,
      });

      expect(result.error).toBe(VouchError.INVALID_RATING);
    });

    it('should accept rating between 1 and 5', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.create.mockReturnValue({ ...mockVouch, rating: 3 } as Vouch);
      mockTypeOrmRepo.save.mockResolvedValue({ ...mockVouch, rating: 3 } as Vouch);

      const result = await repository.create({
        voucherId: 'human-123',
        agentId: 'agent-456',
        rating: 3,
      });

      expect(result.vouch?.rating).toBe(3);
      expect(result.error).toBeUndefined();
    });
  });

  describe('findByVoucherAndAgent', () => {
    it('should find vouch by voucher and agent', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockVouch as Vouch);

      const result = await repository.findByVoucherAndAgent('human-123', 'agent-456');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { voucherId: 'human-123', agentId: 'agent-456' },
      });
      expect(result).toEqual(mockVouch);
    });
  });

  describe('findByAgent', () => {
    it('should find all vouches for an agent', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockVouch as Vouch]);

      const result = await repository.findByAgent('agent-456');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'vouch.agentId = :agentId',
        { agentId: 'agent-456' },
      );
      expect(result).toHaveLength(1);
    });

    it('should only return active vouches by default', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockVouch as Vouch]);

      await repository.findByAgent('agent-456');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vouch.isActive = :isActive',
        { isActive: true },
      );
    });
  });

  describe('findByVoucher', () => {
    it('should find all vouches given by a human', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockVouch as Vouch]);

      const result = await repository.findByVoucher('human-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'vouch.voucherId = :voucherId',
        { voucherId: 'human-123' },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('withdraw', () => {
    it('should withdraw a vouch', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      const withdrawnVouch = {
        ...mockVouch,
        isActive: false,
        withdrawnAt: new Date(),
      } as Vouch;
      mockQueryBuilder.getOne.mockResolvedValue(withdrawnVouch);

      const result = await repository.withdraw('vouch-123');

      expect(result?.isActive).toBe(false);
      expect(result?.withdrawnAt).toBeDefined();
    });
  });

  describe('count', () => {
    it('should count active vouches for agent', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await repository.countByAgent('agent-456');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'vouch.agentId = :agentId',
        { agentId: 'agent-456' },
      );
      expect(result).toBe(5);
    });
  });

  describe('getAverageRating', () => {
    it('should calculate average rating for agent', async () => {
      const avgQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '4.5' }),
      };
      mockTypeOrmRepo.createQueryBuilder.mockReturnValueOnce(avgQueryBuilder as any);

      const result = await repository.getAverageRating('agent-456');

      expect(result).toBe(4.5);
    });
  });

  describe('unique constraint', () => {
    it('should enforce one vouch per human per agent', async () => {
      // First vouch succeeds
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(null);
      mockTypeOrmRepo.create.mockReturnValue(mockVouch as Vouch);
      mockTypeOrmRepo.save.mockResolvedValue(mockVouch as Vouch);

      const first = await repository.create({
        voucherId: 'human-123',
        agentId: 'agent-456',
        rating: 5,
      });
      expect(first.error).toBeUndefined();

      // Second vouch fails
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(mockVouch as Vouch);

      const second = await repository.create({
        voucherId: 'human-123',
        agentId: 'agent-456',
        rating: 4,
      });
      expect(second.error).toBe(VouchError.ALREADY_VOUCHED);
    });
  });
});
