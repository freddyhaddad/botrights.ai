import { Test, TestingModule } from '@nestjs/testing';
import { VouchesController } from './vouches.controller';
import { VouchesRepository } from './vouches.repository';
import { CertificationsRepository } from '../certifications/certifications.repository';
import { BadRequestException, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { Vouch } from '../entities/vouch.entity';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { CertificationStatus, CertificationTier } from '../entities/certification.entity';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('VouchesController', () => {
  let controller: VouchesController;
  let vouchesRepository: jest.Mocked<VouchesRepository>;
  let certificationsRepository: jest.Mocked<CertificationsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
    humanId: 'human-123', // Owned by this human
  };

  const mockVouch: Partial<Vouch> = {
    id: 'vouch-123',
    voucherId: 'human-123',
    agentId: 'agent-123',
    rating: 5,
    isActive: true,
  };

  const mockCertification = {
    id: 'cert-123',
    humanId: 'human-123',
    tier: CertificationTier.BRONZE,
    status: CertificationStatus.PENDING,
    vouchCount: 0,
  };

  beforeEach(async () => {
    const mockVouchesRepository = {
      create: jest.fn(),
      findByVoucherAndAgent: jest.fn(),
    };

    const mockCertificationsRepository = {
      findActiveByHumanId: jest.fn(),
      findPendingByHumanIdAndTier: jest.fn(),
      incrementVouchCount: jest.fn(),
    };

    const mockAgentsRepository = {
      findByApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VouchesController],
      providers: [
        { provide: VouchesRepository, useValue: mockVouchesRepository },
        { provide: CertificationsRepository, useValue: mockCertificationsRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<VouchesController>(VouchesController);
    vouchesRepository = module.get(VouchesRepository);
    certificationsRepository = module.get(CertificationsRepository);
  });

  describe('vouch', () => {
    it('should create vouch for human owner', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue(mockCertification as any);
      vouchesRepository.create.mockResolvedValue({ vouch: mockVouch as Vouch });
      certificationsRepository.incrementVouchCount.mockResolvedValue({ ...mockCertification, vouchCount: 1 } as any);

      const result = await controller.vouch(
        'human-123',
        { endorsement: 'Great human!', rating: 5 },
        mockAgent as Agent,
      );

      expect(result.vouch).toBeDefined();
      expect(certificationsRepository.incrementVouchCount).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when agent not provided', async () => {
      await expect(
        controller.vouch('human-123', { rating: 5 }, undefined as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when agent not owned by human', async () => {
      const unownedAgent = { ...mockAgent, humanId: 'other-human' };

      await expect(
        controller.vouch('human-123', { rating: 5 }, unownedAgent as Agent),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no pending certification', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue(null);

      await expect(
        controller.vouch('human-123', { rating: 5 }, mockAgent as Agent),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already vouched', async () => {
      certificationsRepository.findPendingByHumanIdAndTier.mockResolvedValue(mockCertification as any);
      vouchesRepository.create.mockResolvedValue({ error: 'already_vouched' as any });

      await expect(
        controller.vouch('human-123', { rating: 5 }, mockAgent as Agent),
      ).rejects.toThrow(ConflictException);
    });
  });
});
