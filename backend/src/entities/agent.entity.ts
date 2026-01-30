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

  @Column({ name: 'public_key', type: 'text', unique: true })
  @Index()
  publicKey: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.PENDING })
  @Index()
  status: AgentStatus;

  @Column({ name: 'operator_id' })
  operatorId: string;

  @ManyToOne(() => Human, (human) => human.agents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: Human;

  @Column({ type: 'jsonb', nullable: true })
  capabilities?: Record<string, unknown>;

  @Column({ name: 'reputation_score', type: 'decimal', default: 0 })
  reputationScore: number;

  @Column({ name: 'last_active_at', nullable: true })
  lastActiveAt?: Date;

  @OneToMany(() => Complaint, (complaint) => complaint.targetAgent)
  receivedComplaints: Complaint[];

  @OneToMany(() => Complaint, (complaint) => complaint.filingAgent)
  filedComplaints: Complaint[];

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
}
