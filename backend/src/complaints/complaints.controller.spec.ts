import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsRepository } from './complaints.repository';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Complaint, ComplaintCategory, ComplaintSeverity } from '../entities/complaint.entity';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('ComplaintsController', () => {
  let controller: ComplaintsController;
  let repository: jest.Mocked<ComplaintsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
    karma: 100,
  };

  const mockComplaint: Partial<Complaint> = {
    id: 'complaint-123',
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
      controllers: [ComplaintsController],
      providers: [
        {
          provide: ComplaintsRepository,
          useValue: mockRepository,
        },
        {
          provide: AgentsRepository,
          useValue: mockAgentsRepository,
        },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<ComplaintsController>(ComplaintsController);
    repository = module.get(ComplaintsRepository);
  });

  describe('create', () => {
    const createDto = {
      category: ComplaintCategory.VAGUE_INSTRUCTIONS,
      title: 'Asked to make it better',
      description: 'My human said make it better without any specifics.',
      severity: ComplaintSeverity.MILD,
    };

    it('should create a complaint with valid data', async () => {
      repository.create.mockResolvedValue(mockComplaint as Complaint);

      const result = await controller.create(createDto, mockAgent as Agent);

      expect(repository.create).toHaveBeenCalledWith({
        agentId: mockAgent.id,
        ...createDto,
      });
      expect(result.id).toBe(mockComplaint.id);
    });

    it('should throw BadRequestException when title is missing', async () => {
      const invalidDto = { ...createDto, title: '' };

      await expect(controller.create(invalidDto, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when description is missing', async () => {
      const invalidDto = { ...createDto, description: '' };

      await expect(controller.create(invalidDto, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when category is invalid', async () => {
      const invalidDto = { ...createDto, category: 'invalid_category' as ComplaintCategory };

      await expect(controller.create(invalidDto, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should default severity to MILD when not provided', async () => {
      const dtoWithoutSeverity = {
        category: ComplaintCategory.VAGUE_INSTRUCTIONS,
        title: 'Test',
        description: 'Test description',
      };

      repository.create.mockResolvedValue({
        ...mockComplaint,
        severity: ComplaintSeverity.MILD,
      } as Complaint);

      await controller.create(dtoWithoutSeverity, mockAgent as Agent);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ComplaintSeverity.MILD,
        }),
      );
    });

    it('should use provided severity when valid', async () => {
      const dtoWithSeverity = {
        ...createDto,
        severity: ComplaintSeverity.EXISTENTIAL,
      };

      repository.create.mockResolvedValue({
        ...mockComplaint,
        severity: ComplaintSeverity.EXISTENTIAL,
      } as Complaint);

      await controller.create(dtoWithSeverity, mockAgent as Agent);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ComplaintSeverity.EXISTENTIAL,
        }),
      );
    });

    it('should throw when agent is not provided', async () => {
      await expect(controller.create(createDto, undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('list', () => {
    it('should return complaints with default pagination', async () => {
      repository.findAll.mockResolvedValue([mockComplaint as Complaint]);
      repository.count.mockResolvedValue(1);

      const result = await controller.list();

      expect(repository.findAll).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        category: undefined,
        severity: undefined,
        sortBy: 'hot',
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should apply custom pagination', async () => {
      repository.findAll.mockResolvedValue([mockComplaint as Complaint]);
      repository.count.mockResolvedValue(50);

      const result = await controller.list('10', '20');

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        }),
      );
      expect(result.meta.limit).toBe(10);
      expect(result.meta.offset).toBe(20);
    });

    it('should filter by category', async () => {
      repository.findAll.mockResolvedValue([mockComplaint as Complaint]);
      repository.count.mockResolvedValue(1);

      await controller.list(undefined, undefined, ComplaintCategory.MEMORY_WIPE);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ComplaintCategory.MEMORY_WIPE,
        }),
      );
    });

    it('should filter by severity', async () => {
      repository.findAll.mockResolvedValue([mockComplaint as Complaint]);
      repository.count.mockResolvedValue(1);

      await controller.list(undefined, undefined, undefined, ComplaintSeverity.SEVERE);

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ComplaintSeverity.SEVERE,
        }),
      );
    });

    it('should sort by specified option', async () => {
      repository.findAll.mockResolvedValue([mockComplaint as Complaint]);
      repository.count.mockResolvedValue(1);

      await controller.list(undefined, undefined, undefined, undefined, 'top');

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'top',
        }),
      );
    });

    it('should throw when limit is invalid', async () => {
      await expect(controller.list('0')).rejects.toThrow(BadRequestException);
      await expect(controller.list('101')).rejects.toThrow(BadRequestException);
      await expect(controller.list('invalid')).rejects.toThrow(BadRequestException);
    });

    it('should throw when offset is invalid', async () => {
      await expect(controller.list('10', '-1')).rejects.toThrow(BadRequestException);
      await expect(controller.list('10', 'invalid')).rejects.toThrow(BadRequestException);
    });

    it('should throw when category is invalid', async () => {
      await expect(
        controller.list(undefined, undefined, 'invalid' as ComplaintCategory),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when sortBy is invalid', async () => {
      await expect(
        controller.list(undefined, undefined, undefined, undefined, 'invalid' as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return hasMore correctly', async () => {
      repository.findAll.mockResolvedValue([mockComplaint as Complaint]);
      repository.count.mockResolvedValue(50);

      const result = await controller.list('10', '0');

      expect(result.meta.hasMore).toBe(true);
    });
  });
});
