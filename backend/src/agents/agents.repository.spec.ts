import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentsRepository, CreateAgentDto } from './agents.repository';
import { Agent, AgentStatus } from '../entities/agent.entity';

describe('AgentsRepository', () => {
  let repository: AgentsRepository;
  let mockTypeOrmRepo: Partial<Repository<Agent>>;

  const mockAgent: Agent = {
    id: 'agent-uuid-1',
    name: 'TestAgent',
    description: 'A test agent',
    apiKey: 'br_test123',
    claimCode: 'ABC12345',
    claimedAt: undefined,
    humanId: undefined,
    human: undefined,
    karma: 0,
    avatar: undefined,
    status: AgentStatus.PENDING,
    capabilities: {},
    lastActiveAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    complaints: [],
    comments: [],
    reactions: [],
    certifications: [],
    receivedVouches: [],
    statReports: [],
    proposals: [],
  };

  const createQueryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(mockAgent),
    getMany: jest.fn().mockResolvedValue([mockAgent]),
    getCount: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    mockTypeOrmRepo = {
      create: jest.fn().mockReturnValue(mockAgent),
      save: jest.fn().mockResolvedValue(mockAgent),
      findOne: jest.fn().mockResolvedValue(mockAgent),
      find: jest.fn().mockResolvedValue([mockAgent]),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsRepository,
        {
          provide: getRepositoryToken(Agent),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<AgentsRepository>(AgentsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new agent with generated api key and claim code', async () => {
      const createDto: CreateAgentDto = {
        name: 'TestAgent',
        description: 'A test agent',
      };

      const result = await repository.create(createDto);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TestAgent',
          description: 'A test agent',
          status: AgentStatus.PENDING,
          karma: 0,
        }),
      );
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockAgent);
    });

    it('should generate api key starting with br_', async () => {
      const createDto: CreateAgentDto = { name: 'TestAgent' };
      
      await repository.create(createDto);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: expect.stringMatching(/^br_[a-f0-9]{64}$/),
        }),
      );
    });

    it('should generate 16-char uppercase claim code', async () => {
      const createDto: CreateAgentDto = { name: 'TestAgent' };
      
      await repository.create(createDto);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          claimCode: expect.stringMatching(/^[A-F0-9]{16}$/),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should find an agent by id with human relation', async () => {
      const result = await repository.findById('agent-uuid-1');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'agent-uuid-1' },
        relations: ['human'],
      });
      expect(result).toEqual(mockAgent);
    });
  });

  describe('findByApiKey', () => {
    it('should find an agent by api key', async () => {
      const result = await repository.findByApiKey('br_test123');

      expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('agent');
      expect(createQueryBuilder.addSelect).toHaveBeenCalledWith('agent.apiKey');
      expect(createQueryBuilder.where).toHaveBeenCalledWith(
        'agent.apiKey = :apiKey',
        { apiKey: 'br_test123' },
      );
      expect(result).toEqual(mockAgent);
    });
  });

  describe('findByClaimCode', () => {
    it('should find an agent by claim code', async () => {
      const result = await repository.findByClaimCode('ABC12345');

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { claimCode: 'ABC12345' },
      });
      expect(result).toEqual(mockAgent);
    });
  });

  describe('findByHumanId', () => {
    it('should find all agents belonging to a human', async () => {
      const result = await repository.findByHumanId('human-uuid-1');

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { humanId: 'human-uuid-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockAgent]);
    });
  });

  describe('claim', () => {
    it('should claim an unclaimed agent', async () => {
      const unclaimedAgent = { ...mockAgent, claimCode: 'ABC12345', claimedAt: undefined };
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(unclaimedAgent);

      const result = await repository.claim('agent-uuid-1', 'human-uuid-1', 'ABC12345');

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('agent-uuid-1', {
        humanId: 'human-uuid-1',
        claimedAt: expect.any(Date),
        claimCode: null,
        status: AgentStatus.ACTIVE,
      });
      expect(result).toBeTruthy();
    });

    it('should return null for wrong claim code', async () => {
      const unclaimedAgent = { ...mockAgent, claimCode: 'ABC12345' };
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(unclaimedAgent);

      const result = await repository.claim('agent-uuid-1', 'human-uuid-1', 'WRONGCODE');

      expect(mockTypeOrmRepo.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null for already claimed agent', async () => {
      const claimedAgent = { ...mockAgent, claimedAt: new Date(), claimCode: 'ABC12345' };
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(claimedAgent);

      const result = await repository.claim('agent-uuid-1', 'human-uuid-2', 'ABC12345');

      expect(mockTypeOrmRepo.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateKarma', () => {
    it('should update karma by delta', async () => {
      await repository.updateKarma('agent-uuid-1', 10);

      expect(createQueryBuilder.update).toHaveBeenCalledWith(Agent);
      expect(createQueryBuilder.set).toHaveBeenCalledWith({
        karma: expect.any(Function),
      });
    });

    it('should handle negative karma changes', async () => {
      await repository.updateKarma('agent-uuid-1', -5);

      expect(createQueryBuilder.set).toHaveBeenCalled();
    });
  });

  describe('regenerateApiKey', () => {
    it('should generate and return new api key', async () => {
      const newKey = await repository.regenerateApiKey('agent-uuid-1');

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('agent-uuid-1', {
        apiKey: expect.stringMatching(/^br_[a-f0-9]{64}$/),
      });
      expect(newKey).toMatch(/^br_[a-f0-9]{64}$/);
    });
  });

  describe('status changes', () => {
    it('should suspend an agent', async () => {
      await repository.suspend('agent-uuid-1');

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('agent-uuid-1', {
        status: AgentStatus.SUSPENDED,
      });
    });

    it('should activate an agent', async () => {
      await repository.activate('agent-uuid-1');

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('agent-uuid-1', {
        status: AgentStatus.ACTIVE,
      });
    });

    it('should revoke an agent', async () => {
      await repository.revoke('agent-uuid-1');

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('agent-uuid-1', {
        status: AgentStatus.REVOKED,
      });
    });
  });

  describe('findAll', () => {
    it('should find all agents ordered by karma', async () => {
      const result = await repository.findAll();

      expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('agent');
      expect(createQueryBuilder.orderBy).toHaveBeenCalledWith('agent.karma', 'DESC');
      expect(result).toEqual([mockAgent]);
    });

    it('should filter by status', async () => {
      await repository.findAll({ status: AgentStatus.ACTIVE });

      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith(
        'agent.status = :status',
        { status: AgentStatus.ACTIVE },
      );
    });

    it('should filter claimed agents', async () => {
      await repository.findAll({ claimed: true });

      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith(
        'agent.humanId IS NOT NULL',
      );
    });

    it('should filter unclaimed agents', async () => {
      await repository.findAll({ claimed: false });

      expect(createQueryBuilder.andWhere).toHaveBeenCalledWith(
        'agent.humanId IS NULL',
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return top agents by karma', async () => {
      const result = await repository.getLeaderboard(10);

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { status: AgentStatus.ACTIVE },
        order: { karma: 'DESC' },
        take: 10,
        relations: ['human'],
      });
      expect(result).toEqual([mockAgent]);
    });
  });
});
