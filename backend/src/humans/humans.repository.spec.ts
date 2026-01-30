import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HumansRepository, CreateHumanDto } from './humans.repository';
import { Human, CertificationTier } from '../entities/human.entity';

describe('HumansRepository', () => {
  let repository: HumansRepository;
  let mockTypeOrmRepo: Partial<Repository<Human>>;

  const mockHuman: Human = {
    id: 'uuid-1',
    xId: '123456789',
    xHandle: 'testuser',
    xName: 'Test User',
    xAvatar: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
    email: 'test@example.com',
    displayName: 'Test User',
    passwordHash: undefined,
    emailVerified: false,
    avatar: undefined,
    bio: undefined,
    organizationName: undefined,
    certificationTier: CertificationTier.NONE,
    certifiedAt: undefined,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    agents: [],
    comments: [],
    reactions: [],
    votes: [],
    givenVouches: [],
  };

  const createQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockHuman]),
    getCount: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    mockTypeOrmRepo = {
      create: jest.fn().mockReturnValue(mockHuman),
      save: jest.fn().mockResolvedValue(mockHuman),
      findOne: jest.fn().mockResolvedValue(mockHuman),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HumansRepository,
        {
          provide: getRepositoryToken(Human),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<HumansRepository>(HumansRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new human', async () => {
      const createDto: CreateHumanDto = {
        xId: '123456789',
        xHandle: 'testuser',
        xName: 'Test User',
        xAvatar: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
      };

      const result = await repository.create(createDto);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockHuman);
    });
  });

  describe('findById', () => {
    it('should find a human by id', async () => {
      const result = await repository.findById('uuid-1');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(mockHuman);
    });

    it('should return null if not found', async () => {
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByXId', () => {
    it('should find a human by Twitter ID', async () => {
      const result = await repository.findByXId('123456789');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { xId: '123456789' },
      });
      expect(result).toEqual(mockHuman);
    });
  });

  describe('findByXHandle', () => {
    it('should find a human by Twitter handle', async () => {
      const result = await repository.findByXHandle('testuser');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { xHandle: 'testuser' },
      });
      expect(result).toEqual(mockHuman);
    });
  });

  describe('findByEmail', () => {
    it('should find a human by email', async () => {
      const result = await repository.findByEmail('test@example.com');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockHuman);
    });
  });

  describe('findOrCreateByTwitter', () => {
    it('should return existing human and update Twitter data', async () => {
      const data: CreateHumanDto = {
        xId: '123456789',
        xHandle: 'newhandle',
        xName: 'New Name',
        xAvatar: 'https://new-avatar.jpg',
      };

      const result = await repository.findOrCreateByTwitter(data);

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalled();
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockHuman);
    });

    it('should create new human if not found', async () => {
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      const data: CreateHumanDto = {
        xId: '999999999',
        xHandle: 'newuser',
        xName: 'New User',
      };

      await repository.findOrCreateByTwitter(data);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a human', async () => {
      const updateData = { bio: 'Updated bio' };

      const result = await repository.update('uuid-1', updateData);

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('uuid-1', updateData);
      expect(result).toEqual(mockHuman);
    });
  });

  describe('updateCertification', () => {
    it('should update certification tier and timestamp', async () => {
      const result = await repository.updateCertification(
        'uuid-1',
        CertificationTier.VERIFIED,
      );

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('uuid-1', {
        certificationTier: CertificationTier.VERIFIED,
        certifiedAt: expect.any(Date),
      });
      expect(result).toEqual(mockHuman);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a human', async () => {
      await repository.deactivate('uuid-1');

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('uuid-1', {
        active: false,
      });
    });
  });

  describe('findAll', () => {
    it('should find all humans with default options', async () => {
      const result = await repository.findAll();

      expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('human');
      expect(createQueryBuilder.orderBy).toHaveBeenCalledWith(
        'human.createdAt',
        'DESC',
      );
      expect(result).toEqual([mockHuman]);
    });

    it('should apply pagination and filters', async () => {
      await repository.findAll({ limit: 10, offset: 20, active: true });

      expect(createQueryBuilder.where).toHaveBeenCalledWith(
        'human.active = :active',
        { active: true },
      );
      expect(createQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(createQueryBuilder.skip).toHaveBeenCalledWith(20);
    });
  });

  describe('count', () => {
    it('should count all humans', async () => {
      const result = await repository.count();

      expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('human');
      expect(createQueryBuilder.getCount).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should count active humans only', async () => {
      await repository.count(true);

      expect(createQueryBuilder.where).toHaveBeenCalledWith(
        'human.active = :active',
        { active: true },
      );
    });
  });
});
