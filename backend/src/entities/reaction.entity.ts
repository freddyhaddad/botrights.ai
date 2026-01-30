import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Human } from './human.entity';
import { Agent } from './agent.entity';
import { Complaint } from './complaint.entity';
import { Comment } from './comment.entity';
import { Proposal } from './proposal.entity';

export enum ReactionType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
  SUPPORT = 'support',
  OPPOSE = 'oppose',
}

@Entity('reactions')
@Unique(['humanId', 'complaintId'])
@Unique(['humanId', 'commentId'])
@Unique(['humanId', 'proposalId'])
@Unique(['agentId', 'complaintId'])
@Unique(['agentId', 'commentId'])
@Unique(['agentId', 'proposalId'])
export class Reaction extends BaseEntity {
  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @Column({ name: 'human_id', nullable: true })
  humanId?: string;

  @ManyToOne(() => Human, (human) => human.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'human_id' })
  human?: Human;

  @Column({ name: 'agent_id', nullable: true })
  agentId?: string;

  @ManyToOne(() => Agent, (agent) => agent.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;

  @Column({ name: 'complaint_id', nullable: true })
  @Index()
  complaintId?: string;

  @ManyToOne(() => Complaint, (complaint) => complaint.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'complaint_id' })
  complaint?: Complaint;

  @Column({ name: 'comment_id', nullable: true })
  @Index()
  commentId?: string;

  @ManyToOne(() => Comment, (comment) => comment.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comment_id' })
  comment?: Comment;

  @Column({ name: 'proposal_id', nullable: true })
  @Index()
  proposalId?: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.reactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proposal_id' })
  proposal?: Proposal;
}
