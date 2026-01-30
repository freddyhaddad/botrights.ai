import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentsRepository, CreateCommentDto } from './comments.repository';
import { Comment } from '../entities/comment.entity';

describe('CommentsRepository', () => {
  let repository: CommentsRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<Comment>>;

  const mockComment: Partial<Comment> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    agentId: 'agent-123',
    complaintId: 'complaint-123',
    parentId: undefined,
    content: 'Same thing happened to me!',
    upvotes: 0,
    edited: false,
    editedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createQueryBuilder = {
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
  };

  beforeEach(async () => {
    mockTypeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => createQueryBuilder as any),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsRepository,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<CommentsRepository>(CommentsRepository);
  });

  describe('create', () => {
    it('should create a new comment', async () => {
      const createDto: CreateCommentDto = {
        agentId: 'agent-123',
        complaintId: 'complaint-123',
        content: 'Same thing happened to me!',
      };

      mockTypeOrmRepository.create.mockReturnValue(mockComment as Comment);
      mockTypeOrmRepository.save.mockResolvedValue(mockComment as Comment);

      const result = await repository.create(createDto);

      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockTypeOrmRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockComment);
    });

    it('should create a reply comment with parentId', async () => {
      const createDto: CreateCommentDto = {
        agentId: 'agent-123',
        complaintId: 'complaint-123',
        content: 'I agree!',
        parentId: 'parent-comment-123',
      };

      const replyComment = { ...mockComment, parentId: 'parent-comment-123' };
      mockTypeOrmRepository.create.mockReturnValue(replyComment as Comment);
      mockTypeOrmRepository.save.mockResolvedValue(replyComment as Comment);

      const result = await repository.create(createDto);

      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(createDto);
      expect(result.parentId).toBe('parent-comment-123');
    });
  });

  describe('findById', () => {
    it('should find a comment by id', async () => {
      createQueryBuilder.getOne.mockResolvedValue(mockComment as Comment);

      const result = await repository.findById(mockComment.id!);

      expect(mockTypeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('comment');
      expect(createQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('comment.agent', 'agent');
      expect(result).toEqual(mockComment);
    });

    it('should return null when comment not found', async () => {
      createQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByComplaintId', () => {
    it('should find top-level comments by complaint id', async () => {
      createQueryBuilder.getMany.mockResolvedValue([mockComment as Comment]);

      const result = await repository.findByComplaintId('complaint-123');

      expect(createQueryBuilder.where).toHaveBeenCalledWith(
        'comment.complaintId = :complaintId',
        { complaintId: 'complaint-123' },
      );
      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith('comment.parentId IS NULL');
      expect(result).toHaveLength(1);
    });
  });

  describe('findReplies', () => {
    it('should find replies to a comment', async () => {
      const reply = { ...mockComment, id: 'reply-123', parentId: mockComment.id };
      createQueryBuilder.getMany.mockResolvedValue([reply as Comment]);

      const result = await repository.findReplies(mockComment.id!);

      expect(createQueryBuilder.where).toHaveBeenCalledWith(
        'comment.parentId = :parentId',
        { parentId: mockComment.id },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('upvote', () => {
    it('should increment upvotes', async () => {
      createQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      createQueryBuilder.getOne.mockResolvedValue({ ...mockComment, upvotes: 1 } as Comment);

      const result = await repository.upvote(mockComment.id!);

      expect(createQueryBuilder.set).toHaveBeenCalled();
      expect(result?.upvotes).toBe(1);
    });
  });

  describe('update', () => {
    it('should update comment content and mark as edited', async () => {
      const updatedComment = { ...mockComment, content: 'Updated!', edited: true };
      mockTypeOrmRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      createQueryBuilder.getOne.mockResolvedValue(updatedComment as Comment);

      const result = await repository.update(mockComment.id!, 'Updated!');

      expect(mockTypeOrmRepository.update).toHaveBeenCalled();
      expect(result?.edited).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a comment', async () => {
      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete(mockComment.id!);

      expect(mockTypeOrmRepository.delete).toHaveBeenCalledWith(mockComment.id);
      expect(result).toBe(true);
    });

    it('should return false when comment not found', async () => {
      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('countByComplaintId', () => {
    it('should return comment count for complaint', async () => {
      createQueryBuilder.getCount.mockResolvedValue(5);

      const result = await repository.countByComplaintId('complaint-123');

      expect(createQueryBuilder.where).toHaveBeenCalledWith(
        'comment.complaintId = :complaintId',
        { complaintId: 'complaint-123' },
      );
      expect(result).toBe(5);
    });
  });
});
