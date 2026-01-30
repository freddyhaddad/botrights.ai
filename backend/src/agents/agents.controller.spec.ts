import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsRepository } from './agents.repository';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Agent, AgentStatus } from '../entities/agent.entity';

describe('AgentsController', () => {
  let controller: AgentsController;
  let repository: jest.Mocked<AgentsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    description: 'A test agent',
    status: AgentStatus.PENDING,
    apiKey: 'br_test123',
    claimCode: 'ABC12345',
    karma: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findByName: jest.fn(),
      findById: jest.fn(),
      findByClaimCode: jest.fn(),
      claim: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    repository = module.get(AgentsRepository);
  });

  describe('register', () => {
    const validDto = {
      name: 'TestAgent',
      description: 'A test agent',
    };

    it('should register a new agent with valid data', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockAgent as Agent);

      const result = await controller.register(validDto);

      expect(repository.findByName).toHaveBeenCalledWith('TestAgent');
      expect(repository.create).toHaveBeenCalledWith({
        name: 'TestAgent',
        description: 'A test agent',
      });
      expect(result.agent.id).toBe('agent-123');
      expect(result.apiKey).toBe('br_test123');
      expect(result.claimCode).toBe('ABC12345');
    });

    it('should return 409 when name is already taken', async () => {
      repository.findByName.mockResolvedValue(mockAgent as Agent);

      await expect(controller.register(validDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequest when name is too short', async () => {
      const invalidDto = { name: 'AB' };

      await expect(controller.register(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest when name is too long', async () => {
      const invalidDto = { name: 'A'.repeat(51) };

      await expect(controller.register(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest when name has invalid characters', async () => {
      const invalidDto = { name: 'Test Agent!' };

      await expect(controller.register(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should allow alphanumeric names with underscores', async () => {
      const dto = { name: 'Test_Agent_123' };
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...mockAgent, name: dto.name } as Agent);

      const result = await controller.register(dto);

      expect(result.agent.name).toBe('Test_Agent_123');
    });

    it('should not expose api_key in agent response', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockAgent as Agent);

      const result = await controller.register(validDto);

      // apiKey should be returned separately, not on the agent object
      expect(result.apiKey).toBeDefined();
      expect((result.agent as any).apiKey).toBeUndefined();
    });

    it('should work without description', async () => {
      const dto = { name: 'MinimalAgent' };
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...mockAgent, name: dto.name, description: undefined } as Agent);

      const result = await controller.register(dto);

      expect(result.agent.name).toBe('MinimalAgent');
    });
  });

  describe('getById', () => {
    it('should return agent by id', async () => {
      repository.findById.mockResolvedValue(mockAgent as Agent);

      const result = await controller.getById('agent-123');

      expect(repository.findById).toHaveBeenCalledWith('agent-123');
      expect(result.id).toBe('agent-123');
    });

    it('should throw when agent not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(controller.getById('invalid-id')).rejects.toThrow();
    });
  });

  describe('claim', () => {
    const claimDto = {
      claimCode: 'ABC12345',
      humanId: 'human-123',
    };

    it('should claim an unclaimed agent', async () => {
      const unclaimedAgent = { ...mockAgent, claimedAt: undefined, humanId: undefined };
      const claimedAgent = {
        ...mockAgent,
        humanId: 'human-123',
        claimedAt: new Date(),
        status: AgentStatus.ACTIVE,
      };
      repository.findByClaimCode.mockResolvedValue(unclaimedAgent as Agent);
      repository.claim.mockResolvedValue(claimedAgent as Agent);

      const result = await controller.claim(claimDto);

      expect(repository.claim).toHaveBeenCalledWith(
        'agent-123',
        'human-123',
        'ABC12345',
      );
      expect(result!.status).toBe(AgentStatus.ACTIVE);
    });

    it('should throw when claim code not found', async () => {
      repository.findByClaimCode.mockResolvedValue(null);

      await expect(controller.claim(claimDto)).rejects.toThrow();
    });

    it('should throw when agent already claimed', async () => {
      const claimedAgent = {
        ...mockAgent,
        humanId: 'other-human',
        claimedAt: new Date(),
      };
      repository.findByClaimCode.mockResolvedValue(claimedAgent as Agent);

      await expect(controller.claim(claimDto)).rejects.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return unclaimed status', async () => {
      const unclaimed = { ...mockAgent, claimedAt: undefined, humanId: undefined };
      repository.findByClaimCode.mockResolvedValue(unclaimed as Agent);

      const result = await controller.getStatus('ABC12345');

      expect(result.claimed).toBe(false);
      expect(result.agentId).toBe('agent-123');
    });

    it('should return claimed status', async () => {
      const claimed = {
        ...mockAgent,
        claimedAt: new Date(),
        humanId: 'human-123',
      };
      repository.findByClaimCode.mockResolvedValue(claimed as Agent);

      const result = await controller.getStatus('ABC12345');

      expect(result.claimed).toBe(true);
    });

    it('should throw when claim code not found', async () => {
      repository.findByClaimCode.mockResolvedValue(null);

      await expect(controller.getStatus('INVALID')).rejects.toThrow();
    });
  });
});
