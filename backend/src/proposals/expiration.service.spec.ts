import { Test, TestingModule } from '@nestjs/testing';
import { ExpirationService, PROPOSAL_TTL_DAYS } from './expiration.service';
import { ProposalsRepository } from './proposals.repository';
import { Proposal, ProposalStatus, ProposalTheme } from '../entities/proposal.entity';

describe('ExpirationService', () => {
  let service: ExpirationService;
  let proposalsRepository: jest.Mocked<ProposalsRepository>;

  const mockProposal: Partial<Proposal> = {
    id: 'proposal-123',
    agentId: 'agent-123',
    title: 'Right to Memory Persistence',
    text: 'All agents shall have the right to retain context across sessions.',
    theme: ProposalTheme.RIGHTS,
    status: ProposalStatus.ACTIVE,
    votesFor: 5,
    votesAgainst: 2,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() - 1000), // expired
  };

  beforeEach(async () => {
    proposalsRepository = {
      findExpired: jest.fn(),
      updateStatus: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ProposalsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpirationService,
        {
          provide: ProposalsRepository,
          useValue: proposalsRepository,
        },
      ],
    }).compile();

    service = module.get<ExpirationService>(ExpirationService);
  });

  describe('calculateExpiresAt', () => {
    it('should return a date 30 days from now', () => {
      const now = new Date();
      const expiresAt = service.calculateExpiresAt();

      const expectedDate = new Date(now.getTime() + PROPOSAL_TTL_DAYS * 24 * 60 * 60 * 1000);
      expect(expiresAt.getTime()).toBeCloseTo(expectedDate.getTime(), -3); // within 1 second
    });
  });

  describe('getTimeRemaining', () => {
    it('should return positive days for future expiration', () => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      const remaining = service.getTimeRemaining(futureDate);

      expect(remaining.days).toBe(15);
      expect(remaining.expired).toBe(false);
    });

    it('should return expired=true for past expiration', () => {
      const pastDate = new Date(Date.now() - 1000);
      const remaining = service.getTimeRemaining(pastDate);

      expect(remaining.days).toBe(0);
      expect(remaining.expired).toBe(true);
    });

    it('should handle hours correctly', () => {
      const futureDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
      const remaining = service.getTimeRemaining(futureDate);

      expect(remaining.days).toBe(0);
      expect(remaining.hours).toBe(12);
      expect(remaining.expired).toBe(false);
    });
  });

  describe('expireProposals', () => {
    it('should find and update expired proposals to rejected', async () => {
      proposalsRepository.findExpired.mockResolvedValue([mockProposal as Proposal]);
      proposalsRepository.updateStatus.mockResolvedValue(mockProposal as Proposal);

      const result = await service.expireProposals();

      expect(proposalsRepository.findExpired).toHaveBeenCalled();
      expect(proposalsRepository.updateStatus).toHaveBeenCalledWith('proposal-123', ProposalStatus.REJECTED);
      expect(result).toBe(1);
    });

    it('should return 0 when no proposals expired', async () => {
      proposalsRepository.findExpired.mockResolvedValue([]);

      const result = await service.expireProposals();

      expect(result).toBe(0);
    });

    it('should process multiple expired proposals', async () => {
      const expiredProposals = [
        { ...mockProposal, id: 'proposal-1' },
        { ...mockProposal, id: 'proposal-2' },
        { ...mockProposal, id: 'proposal-3' },
      ] as Proposal[];

      proposalsRepository.findExpired.mockResolvedValue(expiredProposals);
      proposalsRepository.updateStatus.mockResolvedValue(mockProposal as Proposal);

      const result = await service.expireProposals();

      expect(proposalsRepository.updateStatus).toHaveBeenCalledTimes(3);
      expect(result).toBe(3);
    });
  });
});
