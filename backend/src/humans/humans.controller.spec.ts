import { Test, TestingModule } from '@nestjs/testing';
import { HumansController } from './humans.controller';
import { HumansRepository } from './humans.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { CertificationsRepository } from '../certifications/certifications.repository';
import { NotFoundException } from '@nestjs/common';
import { Human, CertificationTier } from '../entities/human.entity';
import { CertificationStatus } from '../entities/certification.entity';

describe('HumansController', () => {
  let controller: HumansController;
  let humansRepository: jest.Mocked<HumansRepository>;
  let agentsRepository: jest.Mocked<AgentsRepository>;
  let certificationsRepository: jest.Mocked<CertificationsRepository>;

  const mockHuman: Partial<Human> = {
    id: 'human-123',
    xHandle: 'testuser',
    xName: 'Test User',
    certificationTier: CertificationTier.BRONZE,
    createdAt: new Date(),
  };

  const mockAgents = [
    { id: 'agent-1', name: 'Agent1', humanId: 'human-123' },
    { id: 'agent-2', name: 'Agent2', humanId: 'human-123' },
  ];

  const mockCertification = {
    id: 'cert-123',
    humanId: 'human-123',
    tier: CertificationTier.BRONZE,
    status: CertificationStatus.APPROVED,
    vouchCount: 5,
  };

  beforeEach(async () => {
    const mockHumansRepository = {
      findByXHandle: jest.fn(),
    };

    const mockAgentsRepository = {
      findByHumanId: jest.fn(),
    };

    const mockCertificationsRepository = {
      findActiveByHumanId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HumansController],
      providers: [
        { provide: HumansRepository, useValue: mockHumansRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        { provide: CertificationsRepository, useValue: mockCertificationsRepository },
      ],
    }).compile();

    controller = module.get<HumansController>(HumansController);
    humansRepository = module.get(HumansRepository);
    agentsRepository = module.get(AgentsRepository);
    certificationsRepository = module.get(CertificationsRepository);
  });

  describe('getProfile', () => {
    it('should return human profile with agents and certification', async () => {
      humansRepository.findByXHandle.mockResolvedValue(mockHuman as Human);
      agentsRepository.findByHumanId.mockResolvedValue(mockAgents as any);
      certificationsRepository.findActiveByHumanId.mockResolvedValue(mockCertification as any);

      const result = await controller.getProfile('testuser');

      expect(result.human.xHandle).toBe('testuser');
      expect(result.agents).toHaveLength(2);
      expect(result.certification?.tier).toBe(CertificationTier.BRONZE);
    });

    it('should throw NotFoundException when user not found', async () => {
      humansRepository.findByXHandle.mockResolvedValue(null);

      await expect(controller.getProfile('unknown')).rejects.toThrow(NotFoundException);
    });

    it('should return null certification when none exists', async () => {
      humansRepository.findByXHandle.mockResolvedValue(mockHuman as Human);
      agentsRepository.findByHumanId.mockResolvedValue([]);
      certificationsRepository.findActiveByHumanId.mockResolvedValue(null);

      const result = await controller.getProfile('testuser');

      expect(result.certification).toBeNull();
    });
  });
});
