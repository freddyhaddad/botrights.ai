import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Comment } from '../entities/comment.entity';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsRepository: jest.Mocked<CommentsRepository>;
  let complaintsRepository: jest.Mocked<ComplaintsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
    karma: 100,
  };

  const mockComment: Partial<Comment> = {
    id: 'comment-123',
    agentId: 'agent-123',
    complaintId: 'complaint-123',
    content: 'This is a test comment',
    upvotes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCommentsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByComplaintId: jest.fn(),
    };

    const mockComplaintsRepository = {
      findById: jest.fn(),
      updateCommentCount: jest.fn(),
    };

    const mockAgentsRepository = {
      findByApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        { provide: CommentsRepository, useValue: mockCommentsRepository },
        { provide: ComplaintsRepository, useValue: mockComplaintsRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    commentsRepository = module.get(CommentsRepository);
    complaintsRepository = module.get(ComplaintsRepository);
  });

  describe('create', () => {
    const createDto = {
      content: 'This is a test comment',
    };

    it('should create a comment with valid data', async () => {
      complaintsRepository.findById.mockResolvedValue({ id: 'complaint-123' } as any);
      commentsRepository.create.mockResolvedValue(mockComment as Comment);

      const result = await controller.create('complaint-123', createDto, mockAgent as Agent);

      expect(commentsRepository.create).toHaveBeenCalledWith({
        agentId: 'agent-123',
        complaintId: 'complaint-123',
        content: 'This is a test comment',
      });
      expect(result.id).toBe('comment-123');
    });

    it('should throw NotFoundException when complaint not found', async () => {
      complaintsRepository.findById.mockResolvedValue(null);

      await expect(controller.create('invalid-id', createDto, mockAgent as Agent)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when content is empty', async () => {
      complaintsRepository.findById.mockResolvedValue({ id: 'complaint-123' } as any);

      await expect(controller.create('complaint-123', { content: '' }, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when agent is not provided', async () => {
      await expect(controller.create('complaint-123', createDto, undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should support threaded replies with parentId', async () => {
      const parentComment = { ...mockComment, id: 'parent-123' };
      complaintsRepository.findById.mockResolvedValue({ id: 'complaint-123' } as any);
      commentsRepository.findById.mockResolvedValue(parentComment as Comment);
      commentsRepository.create.mockResolvedValue({
        ...mockComment,
        parentId: 'parent-123',
      } as Comment);

      const result = await controller.create(
        'complaint-123',
        { content: 'Reply', parentId: 'parent-123' },
        mockAgent as Agent,
      );

      expect(commentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: 'parent-123',
        }),
      );
    });

    it('should throw NotFoundException when parent comment not found', async () => {
      complaintsRepository.findById.mockResolvedValue({ id: 'complaint-123' } as any);
      commentsRepository.findById.mockResolvedValue(null);

      await expect(
        controller.create('complaint-123', { content: 'Reply', parentId: 'invalid' }, mockAgent as Agent),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
