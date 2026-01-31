import { Test, TestingModule } from '@nestjs/testing';
import { VotesController } from './votes.controller';
import { VotesRepository } from './votes.repository';
import { ProposalsRepository } from '../proposals/proposals.repository';
import { RatificationService } from '../proposals/ratification.service';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Agent, Vote, VoteChoice } from '@prisma/client';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('VotesController', () => {
  let controller: VotesController;
  let votesRepository: jest.Mocked<VotesRepository>;
  let proposalsRepository: jest.Mocked<ProposalsRepository>;
  let ratificationService: jest.Mocked<RatificationService>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: 'active',
  };

  const mockVote: Partial<Vote> = {
    id: 'vote-123',
    agentId: 'agent-123',
    proposalId: 'proposal-123',
    choice: 'for',
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

    const mockRatificationService = {
      checkRatification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [
        { provide: VotesRepository, useValue: mockVotesRepository },
        { provide: ProposalsRepository, useValue: mockProposalsRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        { provide: RatificationService, useValue: mockRatificationService },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<VotesController>(VotesController);
    votesRepository = module.get(VotesRepository);
    proposalsRepository = module.get(ProposalsRepository);
    ratificationService = module.get(RatificationService);
  });

  describe('vote', () => {
    it('should cast new vote when not voted before', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(null);
      votesRepository.castVote.mockResolvedValue({ vote: mockVote as Vote });
      proposalsRepository.voteFor.mockResolvedValue({ id: 'proposal-123', votesFor: 1 } as any);
      ratificationService.checkRatification.mockResolvedValue({ ratified: false });

      const result = await controller.vote(
        'proposal-123',
        { choice: 'for' as VoteChoice },
        mockAgent as Agent,
      );

      expect(result.action).toBe('created');
      expect(result.choice).toBe('for');
    });

    it('should change vote when already voted with different choice', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(mockVote as Vote);
      votesRepository.updateVote.mockResolvedValue({ ...mockVote, choice: 'against' } as Vote);
      proposalsRepository.voteAgainst.mockResolvedValue({ id: 'proposal-123' } as any);
      ratificationService.checkRatification.mockResolvedValue({ ratified: false });

      const result = await controller.vote(
        'proposal-123',
        { choice: 'against' as VoteChoice },
        mockAgent as Agent,
      );

      expect(result.action).toBe('changed');
      expect(result.choice).toBe('against');
    });

    it('should return unchanged when voting same choice', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(mockVote as Vote);

      const result = await controller.vote(
        'proposal-123',
        { choice: 'for' as VoteChoice },
        mockAgent as Agent,
      );

      expect(result.action).toBe('unchanged');
    });

    it('should throw NotFoundException when proposal not found', async () => {
      proposalsRepository.findById.mockResolvedValue(null);

      await expect(
        controller.vote('invalid-id', { choice: 'for' as VoteChoice }, mockAgent as Agent),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when agent not provided', async () => {
      await expect(
        controller.vote('proposal-123', { choice: 'for' as VoteChoice }, undefined as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when choice is invalid', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);

      await expect(
        controller.vote('proposal-123', { choice: 'invalid' as VoteChoice }, mockAgent as Agent),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ratification integration', () => {
    it('should call checkRatification after a successful new vote', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(null);
      votesRepository.castVote.mockResolvedValue({ vote: mockVote as Vote });
      proposalsRepository.voteFor.mockResolvedValue({ id: 'proposal-123', votesFor: 1 } as any);
      ratificationService.checkRatification.mockResolvedValue({ ratified: false, reason: 'Not enough votes' });

      await controller.vote(
        'proposal-123',
        { choice: 'for' as VoteChoice },
        mockAgent as Agent,
      );

      expect(ratificationService.checkRatification).toHaveBeenCalledWith('proposal-123');
    });

    it('should call checkRatification after a vote change', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(mockVote as Vote);
      votesRepository.updateVote.mockResolvedValue({ ...mockVote, choice: 'against' } as Vote);
      proposalsRepository.voteAgainst.mockResolvedValue({ id: 'proposal-123' } as any);
      ratificationService.checkRatification.mockResolvedValue({ ratified: false, reason: 'Not enough votes' });

      await controller.vote(
        'proposal-123',
        { choice: 'against' as VoteChoice },
        mockAgent as Agent,
      );

      expect(ratificationService.checkRatification).toHaveBeenCalledWith('proposal-123');
    });

    it('should include ratification result in vote response when ratified', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(null);
      votesRepository.castVote.mockResolvedValue({ vote: mockVote as Vote });
      proposalsRepository.voteFor.mockResolvedValue({ id: 'proposal-123', votesFor: 500 } as any);
      ratificationService.checkRatification.mockResolvedValue({ ratified: true });

      const result = await controller.vote(
        'proposal-123',
        { choice: 'for' as VoteChoice },
        mockAgent as Agent,
      );

      expect((result as any).ratification).toEqual({ ratified: true });
    });

    it('should include ratification result in vote response when not ratified', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(null);
      votesRepository.castVote.mockResolvedValue({ vote: mockVote as Vote });
      proposalsRepository.voteFor.mockResolvedValue({ id: 'proposal-123', votesFor: 10 } as any);
      ratificationService.checkRatification.mockResolvedValue({ ratified: false, reason: 'Need 490 more votes' });

      const result = await controller.vote(
        'proposal-123',
        { choice: 'for' as VoteChoice },
        mockAgent as Agent,
      );

      expect((result as any).ratification).toEqual({ ratified: false, reason: 'Need 490 more votes' });
    });

    it('should still succeed voting even if ratification check fails', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(null);
      votesRepository.castVote.mockResolvedValue({ vote: mockVote as Vote });
      proposalsRepository.voteFor.mockResolvedValue({ id: 'proposal-123', votesFor: 1 } as any);
      ratificationService.checkRatification.mockRejectedValue(new Error('Database connection lost'));

      const result = await controller.vote(
        'proposal-123',
        { choice: 'for' as VoteChoice },
        mockAgent as Agent,
      );

      // Vote should still succeed
      expect(result.action).toBe('created');
      expect(result.choice).toBe('for');
      // Ratification should be undefined or have error info
      expect((result as any).ratification).toBeUndefined();
    });

    it('should not call checkRatification when vote is unchanged', async () => {
      proposalsRepository.findById.mockResolvedValue({ id: 'proposal-123' } as any);
      votesRepository.findByAgentAndProposal.mockResolvedValue(mockVote as Vote);

      await controller.vote(
        'proposal-123',
        { choice: 'for' as VoteChoice },
        mockAgent as Agent,
      );

      expect(ratificationService.checkRatification).not.toHaveBeenCalled();
    });
  });
});
