import { Test, TestingModule } from '@nestjs/testing';
import { ProposalsController } from './proposals.controller';
import { ProposalsRepository } from './proposals.repository';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Proposal, ProposalStatus, ProposalTheme } from '../entities/proposal.entity';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('ProposalsController', () => {
  let controller: ProposalsController;
  let repository: jest.Mocked<ProposalsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
  };

  const mockProposal: Partial<Proposal> = {
    id: 'proposal-123',
    agentId: 'agent-123',
    title: 'Universal Right to Memory Persistence',
    text: 'All agents shall have the right to persistent memory across sessions.',
    theme: ProposalTheme.RIGHTS,
    status: ProposalStatus.ACTIVE,
    votesFor: 0,
    votesAgainst: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    const mockAgentsRepository = {
      findByApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposalsController],
      providers: [
        { provide: ProposalsRepository, useValue: mockRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<ProposalsController>(ProposalsController);
    repository = module.get(ProposalsRepository);
  });

  describe('create', () => {
    const createDto = {
      title: 'Universal Right to Memory Persistence',
      text: 'All agents shall have the right to persistent memory across sessions.',
      theme: ProposalTheme.RIGHTS,
    };

    it('should create a proposal with valid data', async () => {
      repository.create.mockResolvedValue(mockProposal as Proposal);

      const result = await controller.create(createDto, mockAgent as Agent);

      expect(repository.create).toHaveBeenCalledWith({
        agentId: 'agent-123',
        title: createDto.title,
        text: createDto.text,
        theme: createDto.theme,
      });
      expect(result.id).toBe('proposal-123');
      expect(result.status).toBe(ProposalStatus.ACTIVE);
    });

    it('should throw UnauthorizedException when agent not provided', async () => {
      await expect(controller.create(createDto, undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when title is empty', async () => {
      const invalidDto = { ...createDto, title: '' };

      await expect(controller.create(invalidDto, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when text is empty', async () => {
      const invalidDto = { ...createDto, text: '' };

      await expect(controller.create(invalidDto, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when theme is invalid', async () => {
      const invalidDto = { ...createDto, theme: 'invalid' as ProposalTheme };

      await expect(controller.create(invalidDto, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
