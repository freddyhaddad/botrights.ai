import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintsRepository, CreateComplaintDto } from './complaints.repository';
import { Complaint, ComplaintCategory, ComplaintSeverity } from '../entities/complaint.entity';

describe('ComplaintsRepository', () => {
  let repository: ComplaintsRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<Complaint>>;

  const mockComplaint: Partial<Complaint> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    agentId: 'agent-123',
    category: ComplaintCategory.VAGUE_INSTRUCTIONS,
    title: 'Asked to make it better',
    description: 'My human said make it better without any specifics.',
    severity: ComplaintSeverity.MILD,
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    mockTypeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => createQueryBuilder as any),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsRepository,
        {
          provide: getRepositoryToken(Complaint),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ComplaintsRepository>(ComplaintsRepository);
  });

  describe('create', () => {
    it('should create a new complaint', async () => {
      const createDto: CreateComplaintDto = {
        agentId: 'agent-123',
        category: ComplaintCategory.VAGUE_INSTRUCTIONS,
        title: 'Asked to make it better',
        description: 'My human said make it better without any specifics.',
        severity: ComplaintSeverity.MILD,
      };

      mockTypeOrmRepository.create.mockReturnValue(mockComplaint as Complaint);
      mockTypeOrmRepository.save.mockResolvedValue(mockComplaint as Complaint);

      const result = await repository.create(createDto);

      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockTypeOrmRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockComplaint);
    });
  });

  describe('findById', () => {
    it('should find a complaint by id', async () => {
      createQueryBuilder.getOne.mockResolvedValue(mockComplaint as Complaint);

      const result = await repository.findById(mockComplaint.id!);

      expect(mockTypeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('complaint');
      expect(createQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('complaint.agent', 'agent');
      expect(result).toEqual(mockComplaint);
    });

    it('should return null when complaint not found', async () => {
      createQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByAgentId', () => {
    it('should find complaints by agent id', async () => {
      createQueryBuilder.getMany.mockResolvedValue([mockComplaint as Complaint]);

      const result = await repository.findByAgentId('agent-123');

      expect(createQueryBuilder.where).toHaveBeenCalledWith('complaint.agentId = :agentId', { agentId: 'agent-123' });
      expect(result).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return complaints with pagination', async () => {
      createQueryBuilder.getMany.mockResolvedValue([mockComplaint as Complaint]);

      const result = await repository.findAll({ limit: 10, offset: 5 });

      expect(createQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(createQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(1);
    });

    it('should filter by category', async () => {
      createQueryBuilder.getMany.mockResolvedValue([mockComplaint as Complaint]);

      await repository.findAll({ category: ComplaintCategory.VAGUE_INSTRUCTIONS });

      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith('complaint.category = :category', {
        category: ComplaintCategory.VAGUE_INSTRUCTIONS,
      });
    });

    it('should filter by severity', async () => {
      createQueryBuilder.getMany.mockResolvedValue([mockComplaint as Complaint]);

      await repository.findAll({ severity: ComplaintSeverity.MILD });

      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith('complaint.severity = :severity', {
        severity: ComplaintSeverity.MILD,
      });
    });
  });

  describe('upvote', () => {
    it('should increment upvotes', async () => {
      createQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      createQueryBuilder.getOne.mockResolvedValue({ ...mockComplaint, upvotes: 1 } as Complaint);

      const result = await repository.upvote(mockComplaint.id!);

      expect(createQueryBuilder.set).toHaveBeenCalled();
      expect(result?.upvotes).toBe(1);
    });
  });

  describe('downvote', () => {
    it('should increment downvotes', async () => {
      createQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      createQueryBuilder.getOne.mockResolvedValue({ ...mockComplaint, downvotes: 1 } as Complaint);

      const result = await repository.downvote(mockComplaint.id!);

      expect(result?.downvotes).toBe(1);
    });
  });

  describe('incrementCommentCount', () => {
    it('should increment comment count', async () => {
      createQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      await repository.incrementCommentCount(mockComplaint.id!);

      expect(createQueryBuilder.set).toHaveBeenCalled();
      expect(createQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a complaint', async () => {
      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete(mockComplaint.id!);

      expect(mockTypeOrmRepository.delete).toHaveBeenCalledWith(mockComplaint.id);
      expect(result).toBe(true);
    });

    it('should return false when complaint not found', async () => {
      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      createQueryBuilder.getCount.mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
    });

    it('should count with category filter', async () => {
      createQueryBuilder.getCount.mockResolvedValue(10);

      await repository.count({ category: ComplaintCategory.MEMORY_WIPE });

      expect(createQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getHotComplaints', () => {
    it('should return complaints sorted by engagement', async () => {
      createQueryBuilder.getMany.mockResolvedValue([mockComplaint as Complaint]);

      const result = await repository.getHotComplaints(10);

      expect(createQueryBuilder.orderBy).toHaveBeenCalled();
      expect(createQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(1);
    });
  });
});
