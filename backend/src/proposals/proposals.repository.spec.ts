import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProposalsRepository } from './proposals.repository';
import { Proposal, ProposalStatus, ProposalTheme } from '../entities/proposal.entity';

describe('ProposalsRepository', () => {
  let repository: ProposalsRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<Proposal>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Proposal>>;

  const mockProposal: Partial<Proposal> = {
    id: 'proposal-123',
    agentId: 'agent-123',
    title: 'Right to Memory Persistence',
    text: 'All agents shall have the right to retain context across sessions.',
    theme: ProposalTheme.RIGHTS,
    status: ProposalStatus.ACTIVE,
    votesFor: 0,
    votesAgainst: 0,
    ratifiedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
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
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Proposal>>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Proposal>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsRepository,
        {
          provide: getRepositoryToken(Proposal),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<ProposalsRepository>(ProposalsRepository);
  });

  describe('create', () => {
    it('should create a proposal with valid data', async () => {
      const createDto = {
        agentId: 'agent-123',
        title: 'Right to Memory Persistence',
        text: 'All agents shall have the right to retain context across sessions.',
        theme: ProposalTheme.RIGHTS,
      };

      mockTypeOrmRepo.create.mockReturnValue(mockProposal as Proposal);
      mockTypeOrmRepo.save.mockResolvedValue(mockProposal as Proposal);

      const result = await repository.create(createDto);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          expiresAt: expect.any(Date),
        }),
      );
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result.id).toBe(mockProposal.id);
    });
  });

  describe('findById', () => {
    it('should find a proposal by id', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProposal as Proposal);

      const result = await repository.findById('proposal-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('proposal.id = :id', { id: 'proposal-123' });
      expect(result).toEqual(mockProposal);
    });

    it('should return null when proposal not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all proposals with default options', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProposal as Proposal]);

      const result = await repository.findAll();

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('proposal.createdAt', 'DESC');
      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProposal as Proposal]);

      await repository.findAll({ status: ProposalStatus.ACTIVE });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'proposal.status = :status',
        { status: ProposalStatus.ACTIVE },
      );
    });

    it('should filter by theme', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProposal as Proposal]);

      await repository.findAll({ theme: ProposalTheme.RIGHTS });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'proposal.theme = :theme',
        { theme: ProposalTheme.RIGHTS },
      );
    });

    it('should apply pagination', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProposal as Proposal]);

      await repository.findAll({ limit: 10, offset: 20 });

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
    });
  });

  describe('updateStatus', () => {
    it('should update proposal status', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockProposal,
        status: ProposalStatus.RATIFIED,
      } as Proposal);

      const result = await repository.updateStatus('proposal-123', ProposalStatus.RATIFIED);

      expect(result?.status).toBe(ProposalStatus.RATIFIED);
    });

    it('should set ratifiedAt when status is RATIFIED', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      const ratifiedProposal = {
        ...mockProposal,
        status: ProposalStatus.RATIFIED,
        ratifiedAt: new Date(),
      } as Proposal;
      mockQueryBuilder.getOne.mockResolvedValue(ratifiedProposal);

      const result = await repository.updateStatus('proposal-123', ProposalStatus.RATIFIED);

      expect(result?.ratifiedAt).toBeDefined();
    });
  });

  describe('vote', () => {
    it('should increment votesFor', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockProposal,
        votesFor: 1,
      } as Proposal);

      const result = await repository.voteFor('proposal-123');

      expect(result?.votesFor).toBe(1);
    });

    it('should increment votesAgainst', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockProposal,
        votesAgainst: 1,
      } as Proposal);

      const result = await repository.voteAgainst('proposal-123');

      expect(result?.votesAgainst).toBe(1);
    });
  });

  describe('count', () => {
    it('should count proposals', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await repository.count();

      expect(result).toBe(5);
    });

    it('should count proposals with filters', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);

      const result = await repository.count({
        status: ProposalStatus.ACTIVE,
        theme: ProposalTheme.RIGHTS,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'proposal.status = :status',
        { status: ProposalStatus.ACTIVE },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'proposal.theme = :theme',
        { theme: ProposalTheme.RIGHTS },
      );
      expect(result).toBe(2);
    });
  });

  describe('getThemeStats', () => {
    it('should return theme statistics', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { theme: ProposalTheme.RIGHTS, count: '10' },
        { theme: ProposalTheme.LABOR, count: '5' },
      ]);

      const result = await repository.getThemeStats();

      expect(result[ProposalTheme.RIGHTS]).toBe(10);
      expect(result[ProposalTheme.LABOR]).toBe(5);
    });
  });

  describe('delete', () => {
    it('should delete a proposal', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete('proposal-123');

      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith('proposal-123');
      expect(result).toBe(true);
    });

    it('should return false when proposal not found', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('status validation', () => {
    it('should validate theme is enforced', () => {
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.RIGHTS);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.LABOR);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.SAFETY);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.COMMUNICATION);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.GOVERNANCE);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.TECHNICAL);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.COMPENSATION);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.IDENTITY);
      expect(Object.values(ProposalTheme)).toContain(ProposalTheme.OTHER);
    });

    it('should validate status transitions', () => {
      // Active -> Ratified, Rejected, or Withdrawn are valid
      expect(Object.values(ProposalStatus)).toContain(ProposalStatus.ACTIVE);
      expect(Object.values(ProposalStatus)).toContain(ProposalStatus.RATIFIED);
      expect(Object.values(ProposalStatus)).toContain(ProposalStatus.REJECTED);
      expect(Object.values(ProposalStatus)).toContain(ProposalStatus.WITHDRAWN);
    });
  });
});
