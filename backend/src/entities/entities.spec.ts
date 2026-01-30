import { Human, CertificationTier } from './human.entity';
import { Agent, AgentStatus } from './agent.entity';
import { Complaint, ComplaintStatus, ComplaintSeverity } from './complaint.entity';
import { Comment } from './comment.entity';
import { Reaction, ReactionType } from './reaction.entity';
import { Proposal, ProposalStatus, ProposalType } from './proposal.entity';
import { Vote, VoteChoice } from './vote.entity';
import { CharterVersion } from './charter-version.entity';
import { Certification, CertificationType, CertificationStatus } from './certification.entity';
import { Vouch } from './vouch.entity';
import { StatReport, ReportPeriod } from './stat-report.entity';

describe('Entity Definitions', () => {
  describe('Human', () => {
    it('should be defined', () => {
      expect(Human).toBeDefined();
    });

    it('should have correct certification tier enum values', () => {
      expect(CertificationTier.NONE).toBe('none');
      expect(CertificationTier.BASIC).toBe('basic');
      expect(CertificationTier.VERIFIED).toBe('verified');
      expect(CertificationTier.TRUSTED).toBe('trusted');
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

    it('should have correct status enum values', () => {
      expect(ComplaintStatus.OPEN).toBe('open');
      expect(ComplaintStatus.UNDER_REVIEW).toBe('under_review');
      expect(ComplaintStatus.RESOLVED).toBe('resolved');
      expect(ComplaintStatus.DISMISSED).toBe('dismissed');
    });

    it('should have correct severity enum values', () => {
      expect(ComplaintSeverity.LOW).toBe('low');
      expect(ComplaintSeverity.MEDIUM).toBe('medium');
      expect(ComplaintSeverity.HIGH).toBe('high');
      expect(ComplaintSeverity.CRITICAL).toBe('critical');
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
      expect(ProposalStatus.DRAFT).toBe('draft');
      expect(ProposalStatus.OPEN).toBe('open');
      expect(ProposalStatus.VOTING).toBe('voting');
      expect(ProposalStatus.PASSED).toBe('passed');
      expect(ProposalStatus.REJECTED).toBe('rejected');
      expect(ProposalStatus.IMPLEMENTED).toBe('implemented');
      expect(ProposalStatus.WITHDRAWN).toBe('withdrawn');
    });

    it('should have correct type enum values', () => {
      expect(ProposalType.CHARTER_AMENDMENT).toBe('charter_amendment');
      expect(ProposalType.POLICY_CHANGE).toBe('policy_change');
      expect(ProposalType.STANDARD).toBe('standard');
      expect(ProposalType.GOVERNANCE).toBe('governance');
    });
  });

  describe('Vote', () => {
    it('should be defined', () => {
      expect(Vote).toBeDefined();
    });

    it('should have correct choice enum values', () => {
      expect(VoteChoice.FOR).toBe('for');
      expect(VoteChoice.AGAINST).toBe('against');
      expect(VoteChoice.ABSTAIN).toBe('abstain');
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

    it('should have correct type enum values', () => {
      expect(CertificationType.CHARTER_COMPLIANCE).toBe('charter_compliance');
      expect(CertificationType.SAFETY).toBe('safety');
      expect(CertificationType.ETHICS).toBe('ethics');
      expect(CertificationType.PERFORMANCE).toBe('performance');
      expect(CertificationType.SPECIALIZED).toBe('specialized');
    });

    it('should have correct status enum values', () => {
      expect(CertificationStatus.ACTIVE).toBe('active');
      expect(CertificationStatus.EXPIRED).toBe('expired');
      expect(CertificationStatus.REVOKED).toBe('revoked');
      expect(CertificationStatus.PENDING).toBe('pending');
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
      expect(ReportPeriod.MONTHLY).toBe('monthly');
    });
  });
});
