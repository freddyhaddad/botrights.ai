import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { VotesRepository, VoteError } from './votes.repository';
import { Vote, VoteChoice } from '../entities/vote.entity';

describe('VotesRepository', () => {
  let repository: VotesRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<Vote>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Vote>>;

  const mockVote: Partial<Vote> = {
    id: 'vote-123',
    agentId: 'agent-123',
    proposalId: 'proposal-123',
    choice: VoteChoice.FOR,
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
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Vote>>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Vote>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotesRepository,
        {
          provide: getRepositoryToken(Vote),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<VotesRepository>(VotesRepository);
  });

  describe('castVote', () => {
    it('should create a vote when agent has not voted', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.create.mockReturnValue(mockVote as Vote);
      mockTypeOrmRepo.save.mockResolvedValue(mockVote as Vote);

      const result = await repository.castVote({
        agentId: 'agent-123',
        proposalId: 'proposal-123',
        choice: VoteChoice.FOR,
      });

      expect(result.vote).toEqual(mockVote);
      expect(result.error).toBeUndefined();
    });

    it('should return error when agent already voted', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockVote as Vote);

      const result = await repository.castVote({
        agentId: 'agent-123',
        proposalId: 'proposal-123',
        choice: VoteChoice.FOR,
      });

      expect(result.vote).toBeUndefined();
      expect(result.error).toBe(VoteError.ALREADY_VOTED);
    });
  });

  describe('findByAgentAndProposal', () => {
    it('should find a vote by agent and proposal', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockVote as Vote);

      const result = await repository.findByAgentAndProposal('agent-123', 'proposal-123');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { agentId: 'agent-123', proposalId: 'proposal-123' },
      });
      expect(result).toEqual(mockVote);
    });

    it('should return null when vote not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByAgentAndProposal('agent-123', 'proposal-999');

      expect(result).toBeNull();
    });
  });

  describe('findByProposal', () => {
    it('should find all votes for a proposal', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockVote as Vote]);

      const result = await repository.findByProposal('proposal-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'vote.proposalId = :proposalId',
        { proposalId: 'proposal-123' },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findByAgent', () => {
    it('should find all votes by an agent', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockVote as Vote]);

      const result = await repository.findByAgent('agent-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'vote.agentId = :agentId',
        { agentId: 'agent-123' },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('countByProposal', () => {
    it('should count votes for and against a proposal', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '5' });
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '3' });

      const result = await repository.countByProposal('proposal-123');

      expect(result.for).toBe(5);
      expect(result.against).toBe(3);
    });
  });

  describe('hasVoted', () => {
    it('should return true when agent has voted', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockVote as Vote);

      const result = await repository.hasVoted('agent-123', 'proposal-123');

      expect(result).toBe(true);
    });

    it('should return false when agent has not voted', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.hasVoted('agent-123', 'proposal-123');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a vote', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete('vote-123');

      expect(mockTypeOrmRepo.delete).toHaveBeenCalledWith('vote-123');
      expect(result).toBe(true);
    });

    it('should return false when vote not found', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('VoteChoice validation', () => {
    it('should only allow FOR and AGAINST choices', () => {
      expect(Object.values(VoteChoice)).toEqual(['for', 'against']);
      expect(VoteChoice.FOR).toBe('for');
      expect(VoteChoice.AGAINST).toBe('against');
    });
  });

  describe('unique constraint', () => {
    it('should enforce one vote per agent per proposal via business logic', async () => {
      // First vote succeeds
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(null);
      mockTypeOrmRepo.create.mockReturnValue(mockVote as Vote);
      mockTypeOrmRepo.save.mockResolvedValue(mockVote as Vote);

      const first = await repository.castVote({
        agentId: 'agent-123',
        proposalId: 'proposal-123',
        choice: VoteChoice.FOR,
      });
      expect(first.error).toBeUndefined();

      // Second vote fails
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(mockVote as Vote);

      const second = await repository.castVote({
        agentId: 'agent-123',
        proposalId: 'proposal-123',
        choice: VoteChoice.AGAINST,
      });
      expect(second.error).toBe(VoteError.ALREADY_VOTED);
    });
  });
});
