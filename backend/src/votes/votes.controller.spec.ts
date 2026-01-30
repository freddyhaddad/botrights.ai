import { Test, TestingModule } from '@nestjs/testing';
import { VotesController } from './votes.controller';
import { VotesRepository } from './votes.repository';
import { ProposalsRepository } from '../proposals/proposals.repository';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Vote, VoteChoice } from '../entities/vote.entity';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('VotesController', () => {
  let controller: VotesController;
  let votesRepository: jest.Mocked<VotesRepository>;
  let proposalsRepository: jest.Mocked<ProposalsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
  };

  const mockVote: Partial<Vote> = {
    id: 'vote-123',
    agentId: 'agent-123',
    proposalId: 'proposal-123',
    choice: VoteChoice.FOR,
  };

  beforeEach(async () => {
    const mockVotesRepository = {
      findByAgentAndProposal: jest.fn(),
      castVote: jest.fn(),
      updateVote: jest.fn(),
    };

    const mockProposalsRepository = {
      findById: jest.fn(),
      voteFor: jest.fn(),
      voteAgainst: jest.fn(),
    };

    const mockAgentsRepository = {
      findByApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [
        { provide: VotesRepository, useValue: mockVotesRepository },
        { provide: ProposalsRepository, useValue: mockProposalsRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<VotesController>(VotesController);
    votesRepository = module.get(VotesRepository);
    proposalsRepository = module.get(ProposalsRepository);
  });

  describe('vote', () => {
    it('should cast new vote when not voted before', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(null);
      votesRepository.castVote.mockResolvedValue({ vote: mockVote as Vote });
      proposalsRepository.voteFor.mockResolvedValue({ id: 'proposal-123', votesFor: 1 } as any);

      const result = await controller.vote(
        'proposal-123',
        { choice: VoteChoice.FOR },
        mockAgent as Agent,
      );

      expect(result.action).toBe('created');
      expect(result.choice).toBe(VoteChoice.FOR);
    });

    it('should change vote when already voted with different choice', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(mockVote as Vote);
      votesRepository.updateVote.mockResolvedValue({ ...mockVote, choice: VoteChoice.AGAINST } as Vote);

      const result = await controller.vote(
        'proposal-123',
        { choice: VoteChoice.AGAINST },
        mockAgent as Agent,
      );

      expect(result.action).toBe('changed');
      expect(result.choice).toBe(VoteChoice.AGAINST);
    });

    it('should return unchanged when voting same choice', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(mockVote as Vote);

      const result = await controller.vote(
        'proposal-123',
        { choice: VoteChoice.FOR },
        mockAgent as Agent,
      );

      expect(result.action).toBe('unchanged');
    });

    it('should throw NotFoundException when proposal not found', async () => {
      proposalsRepository.findById.mockResolvedValue(null);

      await expect(
        controller.vote('invalid-id', { choice: VoteChoice.FOR }, mockAgent as Agent),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when agent not provided', async () => {
      await expect(
        controller.vote('proposal-123', { choice: VoteChoice.FOR }, undefined as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when choice is invalid', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);

      await expect(
        controller.vote('proposal-123', { choice: 'invalid' as VoteChoice }, mockAgent as Agent),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
