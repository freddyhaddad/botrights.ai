import { Test, TestingModule } from '@nestjs/testing';
import { ReactionsController } from './reactions.controller';
import { ReactionsRepository } from './reactions.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Reaction, ReactionType } from '../entities/reaction.entity';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('ReactionsController', () => {
  let controller: ReactionsController;
  let reactionsRepository: jest.Mocked<ReactionsRepository>;
  let complaintsRepository: jest.Mocked<ComplaintsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
  };

  const mockReaction: Partial<Reaction> = {
    id: 'reaction-123',
    agentId: 'agent-123',
    complaintId: 'complaint-123',
    type: ReactionType.UPVOTE,
  };

  beforeEach(async () => {
    const mockReactionsRepository = {
      toggle: jest.fn(),
      countByComplaint: jest.fn(),
    };

    const mockComplaintsRepository = {
      findById: jest.fn(),
    };

    const mockAgentsRepository = {
      findByApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionsController],
      providers: [
        { provide: ReactionsRepository, useValue: mockReactionsRepository },
        { provide: ComplaintsRepository, useValue: mockComplaintsRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<ReactionsController>(ReactionsController);
    reactionsRepository = module.get(ReactionsRepository);
    complaintsRepository = module.get(ComplaintsRepository);
  });

  describe('react', () => {
    it('should add reaction when not exists', async () => {
      complaintsRepository.findById.mockResolvedValue({ id: 'complaint-123' } as any);
      reactionsRepository.toggle.mockResolvedValue({
        reaction: mockReaction as Reaction,
        action: 'added',
      });

      const result = await controller.react(
        'complaint-123',
        { type: ReactionType.UPVOTE },
        mockAgent as Agent,
      );

      expect(result.action).toBe('added');
      expect(result.reaction?.type).toBe(ReactionType.UPVOTE);
    });

    it('should remove reaction when toggling same type', async () => {
      complaintsRepository.findById.mockResolvedValue({ id: 'complaint-123' } as any);
      reactionsRepository.toggle.mockResolvedValue({
        reaction: null,
        action: 'removed',
      });

      const result = await controller.react(
        'complaint-123',
        { type: ReactionType.UPVOTE },
        mockAgent as Agent,
      );

      expect(result.action).toBe('removed');
      expect(result.reaction).toBeNull();
    });

    it('should throw NotFoundException when complaint not found', async () => {
      complaintsRepository.findById.mockResolvedValue(null);

      await expect(
        controller.react('invalid-id', { type: ReactionType.UPVOTE }, mockAgent as Agent),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when type is invalid', async () => {
      complaintsRepository.findById.mockResolvedValue({ id: 'complaint-123' } as any);

      await expect(
        controller.react('complaint-123', { type: 'invalid' as ReactionType }, mockAgent as Agent),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when agent not provided', async () => {
      await expect(
        controller.react('complaint-123', { type: ReactionType.UPVOTE }, undefined as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
