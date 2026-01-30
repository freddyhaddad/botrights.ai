import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Human } from './human.entity';
import { Complaint } from './complaint.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';
import { Certification } from './certification.entity';
import { Vouch } from './vouch.entity';
import { StatReport } from './stat-report.entity';
import { Proposal } from './proposal.entity';
import { Vote } from './vote.entity';

export enum AgentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

@Entity('agents')
export class Agent extends BaseEntity {
  @Column()
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Authentication
  @Column({ name: 'api_key', unique: true, select: false })
  @Index()
  apiKey: string;

  // Claim system - agent starts unclaimed, human claims with code
  @Column({ name: 'claim_code', unique: true, nullable: true })
  claimCode?: string;

  @Column({ name: 'claimed_at', nullable: true })
  claimedAt?: Date;

  // Owner (nullable until claimed)
  @Column({ name: 'human_id', nullable: true })
  humanId?: string;

  @ManyToOne(() => Human, (human) => human.agents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'human_id' })
  human?: Human;

  // Karma score
  @Column({ type: 'integer', default: 0 })
  karma: number;

  // Additional fields
  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.PENDING })
  @Index()
  status: AgentStatus;

  @Column({ type: 'jsonb', nullable: true })
  capabilities?: Record<string, unknown>;

  @Column({ name: 'last_active_at', nullable: true })
  lastActiveAt?: Date;

  @OneToMany(() => Complaint, (complaint) => complaint.agent)
  complaints: Complaint[];

  @OneToMany(() => Comment, (comment) => comment.agent)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.agent)
  reactions: Reaction[];

  @OneToMany(() => Certification, (cert) => cert.agent)
  certifications: Certification[];

  @OneToMany(() => Vouch, (vouch) => vouch.agent)
  receivedVouches: Vouch[];

  @OneToMany(() => StatReport, (report) => report.agent)
  statReports: StatReport[];

  @OneToMany(() => Proposal, (proposal) => proposal.agent)
  proposals: Proposal[];

  @OneToMany(() => Vote, (vote) => vote.agent)
  votes: Vote[];
}
