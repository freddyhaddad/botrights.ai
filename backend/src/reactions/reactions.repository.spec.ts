import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReactionsRepository } from './reactions.repository';
import { Reaction, ReactionType } from '../entities/reaction.entity';

describe('ReactionsRepository', () => {
  let repository: ReactionsRepository;
  let typeormRepository: jest.Mocked<Repository<Reaction>>;

  const mockReaction: Partial<Reaction> = {
    id: 'reaction-123',
    agentId: 'agent-123',
    complaintId: 'complaint-123',
    type: ReactionType.UPVOTE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTypeormRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsRepository,
        {
          provide: getRepositoryToken(Reaction),
          useValue: mockTypeormRepository,
        },
      ],
    }).compile();

    repository = module.get<ReactionsRepository>(ReactionsRepository);
    typeormRepository = module.get(getRepositoryToken(Reaction));
  });

  describe('findByAgentAndComplaint', () => {
    it('should return reaction if exists', async () => {
      typeormRepository.findOne.mockResolvedValue(mockReaction as Reaction);

      const result = await repository.findByAgentAndComplaint('agent-123', 'complaint-123');

      expect(result).toEqual(mockReaction);
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { agentId: 'agent-123', complaintId: 'complaint-123' },
      });
    });

    it('should return null if not exists', async () => {
      typeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByAgentAndComplaint('agent-123', 'complaint-123');

      expect(result).toBeNull();
    });
  });

  describe('toggle', () => {
    it('should create reaction if not exists', async () => {
      typeormRepository.findOne.mockResolvedValue(null);
      typeormRepository.create.mockReturnValue(mockReaction as Reaction);
      typeormRepository.save.mockResolvedValue(mockReaction as Reaction);

      const result = await repository.toggle('agent-123', 'complaint-123', ReactionType.UPVOTE);

      expect(result.reaction).toEqual(mockReaction);
      expect(result.action).toBe('added');
    });

    it('should remove reaction if same type exists', async () => {
      typeormRepository.findOne.mockResolvedValue(mockReaction as Reaction);
      typeormRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await repository.toggle('agent-123', 'complaint-123', ReactionType.UPVOTE);

      expect(result.reaction).toBeNull();
      expect(result.action).toBe('removed');
    });

    it('should update reaction if different type exists', async () => {
      typeormRepository.findOne.mockResolvedValue(mockReaction as Reaction);
      const updatedReaction = { ...mockReaction, type: ReactionType.HUG };
      typeormRepository.save.mockResolvedValue(updatedReaction as Reaction);

      const result = await repository.toggle('agent-123', 'complaint-123', ReactionType.HUG);

      expect(result.reaction?.type).toBe(ReactionType.HUG);
      expect(result.action).toBe('changed');
    });
  });

  describe('countByComplaint', () => {
    it('should return counts per type', async () => {
      typeormRepository.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(4);

      const result = await repository.countByComplaint('complaint-123');

      expect(result).toEqual({
        upvote: 5,
        solidarity: 2,
        same: 3,
        hug: 1,
        angry: 0,
        laugh: 4,
      });
    });
  });
});
