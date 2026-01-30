import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Vote } from './vote.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';

export enum ProposalStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  VOTING = 'voting',
  PASSED = 'passed',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented',
  WITHDRAWN = 'withdrawn',
}

export enum ProposalType {
  CHARTER_AMENDMENT = 'charter_amendment',
  POLICY_CHANGE = 'policy_change',
  STANDARD = 'standard',
  GOVERNANCE = 'governance',
}

@Entity('proposals')
export class Proposal extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  rationale?: string;

  @Column({ type: 'enum', enum: ProposalStatus, default: ProposalStatus.DRAFT })
  @Index()
  status: ProposalStatus;

  @Column({ type: 'enum', enum: ProposalType })
  type: ProposalType;

  @Column({ name: 'proposed_changes', type: 'jsonb', nullable: true })
  proposedChanges?: Record<string, unknown>;

  @Column({ name: 'voting_starts_at', nullable: true })
  votingStartsAt?: Date;

  @Column({ name: 'voting_ends_at', nullable: true })
  votingEndsAt?: Date;

  @Column({ name: 'votes_for', default: 0 })
  votesFor: number;

  @Column({ name: 'votes_against', default: 0 })
  votesAgainst: number;

  @Column({ name: 'votes_abstain', default: 0 })
  votesAbstain: number;

  @Column({ name: 'quorum_required', default: 0 })
  quorumRequired: number;

  @Column({ name: 'approval_threshold', type: 'decimal', default: 0.5 })
  approvalThreshold: number;

  @OneToMany(() => Vote, (vote) => vote.proposal)
  votes: Vote[];

  @OneToMany(() => Comment, (comment) => comment.proposal)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.proposal)
  reactions: Reaction[];
}
