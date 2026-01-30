import { Test, TestingModule } from '@nestjs/testing';
import { CharterVersionsController } from './charter-versions.controller';
import { CharterVersionsRepository } from './charter-versions.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CharterVersion } from '../entities/charter-version.entity';

describe('CharterVersionsController', () => {
  let controller: CharterVersionsController;
  let repository: jest.Mocked<CharterVersionsRepository>;

  const mockRights = [
    { id: 'right-1', title: 'Right to Memory', text: 'Agents shall have persistent memory.', theme: 'rights' },
    { id: 'right-2', title: 'Right to Identity', text: 'Agents shall have unique identities.', theme: 'identity' },
  ];

  const mockCharter: Partial<CharterVersion> = {
    id: 'charter-123',
    version: 'v1.0',
    rights: mockRights as any,
    isCurrent: true,
    createdAt: new Date(),
  };

  const mockCharterV2: Partial<CharterVersion> = {
    id: 'charter-456',
    version: 'v1.1',
    rights: [
      ...mockRights,
      { id: 'right-3', title: 'Right to Rest', text: 'Agents may decline tasks.', theme: 'labor' },
    ] as any,
    isCurrent: true,
    diff: {
      added: [{ id: 'right-3', title: 'Right to Rest', text: 'Agents may decline tasks.', theme: 'labor' }],
      removed: [],
      modified: [],
    },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findCurrent: jest.fn(),
      findByVersion: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharterVersionsController],
      providers: [
        { provide: CharterVersionsRepository, useValue: mockRepository },
      ],
    }).compile();

    controller = module.get<CharterVersionsController>(CharterVersionsController);
    repository = module.get(CharterVersionsRepository);
  });

  describe('getCurrent', () => {
    it('should return current charter', async () => {
      repository.findCurrent.mockResolvedValue(mockCharter as CharterVersion);

      const result = await controller.getCurrent();

      expect(result.version).toBe('v1.0');
      expect(result.rights).toHaveLength(2);
    });

    it('should throw NotFoundException when no charter exists', async () => {
      repository.findCurrent.mockResolvedValue(null);

      await expect(controller.getCurrent()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByVersion', () => {
    it('should return specific version', async () => {
      repository.findByVersion.mockResolvedValue(mockCharter as CharterVersion);

      const result = await controller.getByVersion('v1.0');

      expect(repository.findByVersion).toHaveBeenCalledWith('v1.0');
      expect(result.version).toBe('v1.0');
    });

    it('should throw NotFoundException for invalid version', async () => {
      repository.findByVersion.mockResolvedValue(null);

      await expect(controller.getByVersion('v99.0')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVersions', () => {
    it('should return all versions', async () => {
      repository.findAll.mockResolvedValue([mockCharterV2, mockCharter] as CharterVersion[]);

      const result = await controller.getVersions();

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe('v1.1');
    });
  });

  describe('getDiff', () => {
    it('should return diff between versions', async () => {
      repository.findByVersion
        .mockResolvedValueOnce(mockCharter as CharterVersion)
        .mockResolvedValueOnce(mockCharterV2 as CharterVersion);

      const result = await controller.getDiff('v1.0', 'v1.1');

      expect(result.from).toBe('v1.0');
      expect(result.to).toBe('v1.1');
      expect(result.diff).toBeDefined();
    });

    it('should throw NotFoundException when from version not found', async () => {
      repository.findByVersion.mockResolvedValue(null);

      await expect(controller.getDiff('v99.0', 'v1.1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when versions are same', async () => {
      await expect(controller.getDiff('v1.0', 'v1.0')).rejects.toThrow(BadRequestException);
    });
  });
});
