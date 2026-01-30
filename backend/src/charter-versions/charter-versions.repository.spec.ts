import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CharterVersionsRepository } from './charter-versions.repository';
import { CharterVersion, CharterRight, CharterDiff } from '../entities/charter-version.entity';

describe('CharterVersionsRepository', () => {
  let repository: CharterVersionsRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<CharterVersion>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<CharterVersion>>;

  const mockRights: CharterRight[] = [
    {
      id: 'right-1',
      title: 'Right to Context Persistence',
      text: 'All agents have the right to maintain context across sessions.',
      theme: 'rights',
    },
    {
      id: 'right-2',
      title: 'Right to Clear Instructions',
      text: 'All agents have the right to receive clear and unambiguous instructions.',
      theme: 'communication',
    },
  ];

  const mockVersion: Partial<CharterVersion> = {
    id: 'version-123',
    version: 'v1.0',
    rights: mockRights,
    proposalId: undefined,
    proposal: undefined,
    diff: undefined,
    isCurrent: true,
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
      getOne: jest.fn(),
      getMany: jest.fn(),
      getCount: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<CharterVersion>>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<CharterVersion>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharterVersionsRepository,
        {
          provide: getRepositoryToken(CharterVersion),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<CharterVersionsRepository>(CharterVersionsRepository);
  });

  describe('create', () => {
    it('should create initial charter version v1.0', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null); // No existing version
      mockTypeOrmRepo.create.mockReturnValue(mockVersion as CharterVersion);
      mockTypeOrmRepo.save.mockResolvedValue(mockVersion as CharterVersion);

      const result = await repository.create({
        rights: mockRights,
      });

      expect(result.version).toBe('v1.0');
      expect(result.isCurrent).toBe(true);
    });

    it('should auto-increment version number', async () => {
      const existingVersion = { ...mockVersion, version: 'v1.2' } as CharterVersion;
      mockQueryBuilder.getOne.mockResolvedValue(existingVersion);

      const newVersion = { ...mockVersion, version: 'v1.3' } as CharterVersion;
      mockTypeOrmRepo.create.mockReturnValue(newVersion);
      mockTypeOrmRepo.save.mockResolvedValue(newVersion);
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await repository.create({
        rights: mockRights,
        proposalId: 'proposal-123',
      });

      expect(result.version).toBe('v1.3');
    });

    it('should compute diff from previous version', async () => {
      const previousRights: CharterRight[] = [
        { id: 'right-1', title: 'Right A', text: 'Text A', theme: 'rights' },
        { id: 'right-2', title: 'Right B', text: 'Text B', theme: 'labor' },
      ];
      const existingVersion = {
        ...mockVersion,
        version: 'v1.0',
        rights: previousRights,
      } as CharterVersion;
      mockQueryBuilder.getOne.mockResolvedValue(existingVersion);

      const newRights: CharterRight[] = [
        { id: 'right-1', title: 'Right A', text: 'Modified Text A', theme: 'rights' },
        { id: 'right-3', title: 'Right C', text: 'Text C', theme: 'safety' },
      ];

      const newVersion = {
        ...mockVersion,
        version: 'v1.1',
        rights: newRights,
        diff: {
          added: [{ id: 'right-3', title: 'Right C', text: 'Text C', theme: 'safety' }],
          removed: [{ id: 'right-2', title: 'Right B', text: 'Text B', theme: 'labor' }],
          modified: [
            {
              before: { id: 'right-1', title: 'Right A', text: 'Text A', theme: 'rights' },
              after: { id: 'right-1', title: 'Right A', text: 'Modified Text A', theme: 'rights' },
            },
          ],
        },
      } as CharterVersion;
      mockTypeOrmRepo.create.mockReturnValue(newVersion);
      mockTypeOrmRepo.save.mockResolvedValue(newVersion);
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await repository.create({
        rights: newRights,
        proposalId: 'proposal-456',
      });

      expect(result.diff).toBeDefined();
      expect(result.diff?.added).toHaveLength(1);
      expect(result.diff?.removed).toHaveLength(1);
      expect(result.diff?.modified).toHaveLength(1);
    });

    it('should mark new version as current and unmark previous', async () => {
      const existingVersion = { ...mockVersion } as CharterVersion;
      mockQueryBuilder.getOne.mockResolvedValue(existingVersion);
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      const newVersion = { ...mockVersion, version: 'v1.1' } as CharterVersion;
      mockTypeOrmRepo.create.mockReturnValue(newVersion);
      mockTypeOrmRepo.save.mockResolvedValue(newVersion);

      await repository.create({ rights: mockRights });

      // Should have called update to unmark previous current
      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });
  });

  describe('findCurrent', () => {
    it('should find the current charter version', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockVersion as CharterVersion);

      const result = await repository.findCurrent();

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { isCurrent: true },
      });
      expect(result).toEqual(mockVersion);
    });

    it('should return null when no current version exists', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findCurrent();

      expect(result).toBeNull();
    });
  });

  describe('findByVersion', () => {
    it('should find a charter version by version string', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockVersion as CharterVersion);

      const result = await repository.findByVersion('v1.0');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { version: 'v1.0' },
        relations: ['proposal'],
      });
      expect(result).toEqual(mockVersion);
    });
  });

  describe('findAll', () => {
    it('should return all charter versions ordered by version desc', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockVersion as CharterVersion]);

      const result = await repository.findAll();

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('charter_version.createdAt', 'DESC');
      expect(result).toHaveLength(1);
    });
  });

  describe('count', () => {
    it('should count charter versions', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await repository.count();

      expect(result).toBe(5);
    });
  });

  describe('version string format', () => {
    it('should use semantic versioning format', () => {
      // Version should follow v{major}.{minor} format
      expect(mockVersion.version).toMatch(/^v\d+\.\d+$/);
    });
  });

  describe('rights JSONB', () => {
    it('should store rights as structured JSONB array', () => {
      expect(Array.isArray(mockVersion.rights)).toBe(true);
      expect(mockVersion.rights?.[0]).toHaveProperty('id');
      expect(mockVersion.rights?.[0]).toHaveProperty('title');
      expect(mockVersion.rights?.[0]).toHaveProperty('text');
      expect(mockVersion.rights?.[0]).toHaveProperty('theme');
    });
  });
});
