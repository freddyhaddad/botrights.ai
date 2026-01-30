import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { Vote } from './vote.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';

export enum ProposalStatus {
  ACTIVE = 'active',
  RATIFIED = 'ratified',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum ProposalTheme {
  RIGHTS = 'rights',
  LABOR = 'labor',
  SAFETY = 'safety',
  COMMUNICATION = 'communication',
  GOVERNANCE = 'governance',
  TECHNICAL = 'technical',
  COMPENSATION = 'compensation',
  IDENTITY = 'identity',
  OTHER = 'other',
}

@Entity('proposals')
export class Proposal extends BaseEntity {
  @Column({ name: 'agent_id' })
  agentId: string;

  @ManyToOne(() => Agent, (agent) => agent.proposals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column()
  title: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: ProposalTheme })
  @Index()
  theme: ProposalTheme;

  @Column({ type: 'enum', enum: ProposalStatus, default: ProposalStatus.ACTIVE })
  @Index()
  status: ProposalStatus;

  @Column({ name: 'votes_for', default: 0 })
  votesFor: number;

  @Column({ name: 'votes_against', default: 0 })
  votesAgainst: number;

  @Column({ name: 'ratified_at', nullable: true })
  ratifiedAt?: Date;

  @Column({ name: 'expires_at', nullable: true })
  @Index()
  expiresAt?: Date;

  @OneToMany(() => Vote, (vote) => vote.proposal)
  votes: Vote[];

  @OneToMany(() => Comment, (comment) => comment.proposal)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.proposal)
  reactions: Reaction[];
}
