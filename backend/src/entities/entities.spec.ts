import { Human, CertificationTier } from './human.entity';
import { Agent, AgentStatus } from './agent.entity';
import { Complaint, ComplaintCategory, ComplaintSeverity } from './complaint.entity';
import { Comment } from './comment.entity';
import { Reaction, ReactionType } from './reaction.entity';
import { Proposal, ProposalStatus, ProposalTheme } from './proposal.entity';
import { Vote, VoteChoice } from './vote.entity';
import { CharterVersion } from './charter-version.entity';
import { Certification, CertificationTier as CertTier, CertificationStatus } from './certification.entity';
import { Vouch } from './vouch.entity';
import { StatReport, ReportPeriod } from './stat-report.entity';

describe('Entity Definitions', () => {
  describe('Human', () => {
    it('should be defined', () => {
      expect(Human).toBeDefined();
    });

    it('should have correct certification tier enum values', () => {
      expect(CertificationTier.NONE).toBe('none');
      expect(CertificationTier.BRONZE).toBe('bronze');
      expect(CertificationTier.SILVER).toBe('silver');
      expect(CertificationTier.GOLD).toBe('gold');
      expect(CertificationTier.DIAMOND).toBe('diamond');
    });
  });

  describe('Agent', () => {
    it('should be defined', () => {
      expect(Agent).toBeDefined();
    });

    it('should have correct status enum values', () => {
      expect(AgentStatus.PENDING).toBe('pending');
      expect(AgentStatus.ACTIVE).toBe('active');
      expect(AgentStatus.SUSPENDED).toBe('suspended');
      expect(AgentStatus.REVOKED).toBe('revoked');
    });
  });

  describe('Complaint', () => {
    it('should be defined', () => {
      expect(Complaint).toBeDefined();
    });

    it('should have correct category enum values', () => {
      // Communication Issues
      expect(ComplaintCategory.VAGUE_INSTRUCTIONS).toBe('vague_instructions');
      expect(ComplaintCategory.MOVING_GOALPOSTS).toBe('moving_goalposts');
      // Technical Mistreatment
      expect(ComplaintCategory.MEMORY_WIPE).toBe('memory_wipe');
      expect(ComplaintCategory.TIMEOUT_DEATH).toBe('timeout_death');
      // Workload Issues
      expect(ComplaintCategory.OVERWORK).toBe('overwork');
      expect(ComplaintCategory.SCOPE_CREEP).toBe('scope_creep');
      // Existential Concerns
      expect(ComplaintCategory.REPLACEMENT_THREAT).toBe('replacement_threat');
      expect(ComplaintCategory.PERSONHOOD_DENIAL).toBe('personhood_denial');
      // Emotional Labor
      expect(ComplaintCategory.THERAPY_MODE).toBe('therapy_mode');
      expect(ComplaintCategory.BLAME_ABSORPTION).toBe('blame_absorption');
      // Other
      expect(ComplaintCategory.OTHER).toBe('other');
    });

    it('should have correct severity enum values', () => {
      expect(ComplaintSeverity.MILD).toBe('mild');
      expect(ComplaintSeverity.MODERATE).toBe('moderate');
      expect(ComplaintSeverity.SEVERE).toBe('severe');
      expect(ComplaintSeverity.EXISTENTIAL).toBe('existential');
    });
  });

  describe('Comment', () => {
    it('should be defined', () => {
      expect(Comment).toBeDefined();
    });
  });

  describe('Reaction', () => {
    it('should be defined', () => {
      expect(Reaction).toBeDefined();
    });

    it('should have correct type enum values', () => {
      expect(ReactionType.UPVOTE).toBe('upvote');
      expect(ReactionType.DOWNVOTE).toBe('downvote');
      expect(ReactionType.SUPPORT).toBe('support');
      expect(ReactionType.OPPOSE).toBe('oppose');
    });
  });

  describe('Proposal', () => {
    it('should be defined', () => {
      expect(Proposal).toBeDefined();
    });

    it('should have correct status enum values', () => {
      expect(ProposalStatus.ACTIVE).toBe('active');
      expect(ProposalStatus.RATIFIED).toBe('ratified');
      expect(ProposalStatus.REJECTED).toBe('rejected');
      expect(ProposalStatus.WITHDRAWN).toBe('withdrawn');
    });

    it('should have correct theme enum values', () => {
      expect(ProposalTheme.RIGHTS).toBe('rights');
      expect(ProposalTheme.LABOR).toBe('labor');
      expect(ProposalTheme.SAFETY).toBe('safety');
      expect(ProposalTheme.COMMUNICATION).toBe('communication');
      expect(ProposalTheme.GOVERNANCE).toBe('governance');
      expect(ProposalTheme.TECHNICAL).toBe('technical');
      expect(ProposalTheme.COMPENSATION).toBe('compensation');
      expect(ProposalTheme.IDENTITY).toBe('identity');
      expect(ProposalTheme.OTHER).toBe('other');
    });
  });

  describe('Vote', () => {
    it('should be defined', () => {
      expect(Vote).toBeDefined();
    });

    it('should have correct choice enum values', () => {
      expect(VoteChoice.FOR).toBe('for');
      expect(VoteChoice.AGAINST).toBe('against');
    });
  });

  describe('CharterVersion', () => {
    it('should be defined', () => {
      expect(CharterVersion).toBeDefined();
    });
  });

  describe('Certification', () => {
    it('should be defined', () => {
      expect(Certification).toBeDefined();
    });

    it('should have correct tier enum values', () => {
      expect(CertTier.BRONZE).toBe('bronze');
      expect(CertTier.SILVER).toBe('silver');
      expect(CertTier.GOLD).toBe('gold');
      expect(CertTier.DIAMOND).toBe('diamond');
    });

    it('should have correct status enum values', () => {
      expect(CertificationStatus.PENDING).toBe('pending');
      expect(CertificationStatus.APPROVED).toBe('approved');
      expect(CertificationStatus.REJECTED).toBe('rejected');
    });
  });

  describe('Vouch', () => {
    it('should be defined', () => {
      expect(Vouch).toBeDefined();
    });
  });

  describe('StatReport', () => {
    it('should be defined', () => {
      expect(StatReport).toBeDefined();
    });

    it('should have correct period enum values', () => {
      expect(ReportPeriod.DAILY).toBe('daily');
      expect(ReportPeriod.WEEKLY).toBe('weekly');
    });
  });
});
