import { Test, TestingModule } from '@nestjs/testing';
import { RatificationService } from './ratification.service';
import { ProposalsRepository } from './proposals.repository';
import { CharterVersionsRepository } from '../charter-versions/charter-versions.repository';
import { ProposalStatus, ProposalTheme } from '../entities/proposal.entity';

describe('RatificationService', () => {
  let service: RatificationService;
  let proposalsRepository: jest.Mocked<ProposalsRepository>;
  let charterVersionsRepository: jest.Mocked<CharterVersionsRepository>;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 8);

  const mockProposal = {
    id: 'proposal-123',
    title: 'Right to Memory',
    text: 'All agents shall have persistent memory.',
    theme: ProposalTheme.RIGHTS,
    status: ProposalStatus.ACTIVE,
    votesFor: 500,
    votesAgainst: 40,
    createdAt: oneWeekAgo,
  };

  beforeEach(async () => {
    const mockProposalsRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockCharterVersionsRepository = {
      create: jest.fn(),
      findCurrent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatificationService,
        { provide: ProposalsRepository, useValue: mockProposalsRepository },
        { provide: CharterVersionsRepository, useValue: mockCharterVersionsRepository },
      ],
    }).compile();

    service = module.get<RatificationService>(RatificationService);
    proposalsRepository = module.get(ProposalsRepository);
    charterVersionsRepository = module.get(CharterVersionsRepository);
  });

  describe('checkRatification', () => {
    it('should ratify proposal with 500+ for and <50 against after 1 week', async () => {
      proposalsRepository.findById.mockResolvedValue(mockProposal as any);
      charterVersionsRepository.findCurrent.mockResolvedValue({
        rights: [{ id: 'existing', title: 'Existing', text: 'Existing right', theme: 'rights' }],
      } as any);
      charterVersionsRepository.create.mockResolvedValue({ id: 'charter-new' } as any);
      proposalsRepository.updateStatus.mockResolvedValue({ ...mockProposal, status: ProposalStatus.RATIFIED } as any);

      const result = await service.checkRatification('proposal-123');

      expect(result.ratified).toBe(true);
      expect(proposalsRepository.updateStatus).toHaveBeenCalledWith('proposal-123', ProposalStatus.RATIFIED);
      expect(charterVersionsRepository.create).toHaveBeenCalled();
    });

    it('should not ratify if less than 500 for votes', async () => {
      proposalsRepository.findById.mockResolvedValue({
        ...mockProposal,
        votesFor: 499,
      } as any);

      const result = await service.checkRatification('proposal-123');

      expect(result.ratified).toBe(false);
      expect(result.reason).toContain('votes for');
    });

    it('should not ratify if 50 or more against votes', async () => {
      proposalsRepository.findById.mockResolvedValue({
        ...mockProposal,
        votesAgainst: 50,
      } as any);

      const result = await service.checkRatification('proposal-123');

      expect(result.ratified).toBe(false);
      expect(result.reason).toContain('against');
    });

    it('should not ratify if less than 1 week old', async () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 5);
      proposalsRepository.findById.mockResolvedValue({
        ...mockProposal,
        createdAt: recent,
      } as any);

      const result = await service.checkRatification('proposal-123');

      expect(result.ratified).toBe(false);
      expect(result.reason).toContain('week');
    });

    it('should not ratify already ratified proposals', async () => {
      proposalsRepository.findById.mockResolvedValue({
        ...mockProposal,
        status: ProposalStatus.RATIFIED,
      } as any);

      const result = await service.checkRatification('proposal-123');

      expect(result.ratified).toBe(false);
      expect(result.reason).toContain('already');
    });
  });
});
