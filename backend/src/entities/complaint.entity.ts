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
import { Agent } from './agent.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';

export enum ComplaintStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ComplaintSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('complaints')
export class Complaint extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.OPEN,
  })
  @Index()
  status: ComplaintStatus;

  @Column({
    type: 'enum',
    enum: ComplaintSeverity,
    default: ComplaintSeverity.MEDIUM,
  })
  severity: ComplaintSeverity;

  @Column({ name: 'target_agent_id' })
  targetAgentId: string;

  @ManyToOne(() => Agent, (agent) => agent.receivedComplaints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'target_agent_id' })
  targetAgent: Agent;

  @Column({ name: 'reporter_id', nullable: true })
  reporterId?: string;

  @ManyToOne(() => Human, (human) => human.reportedComplaints, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reporter_id' })
  reporter?: Human;

  @Column({ name: 'filing_agent_id', nullable: true })
  filingAgentId?: string;

  @ManyToOne(() => Agent, (agent) => agent.filedComplaints, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'filing_agent_id' })
  filingAgent?: Agent;

  @Column({ type: 'jsonb', nullable: true })
  evidence?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  @OneToMany(() => Comment, (comment) => comment.complaint)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.complaint)
  reactions: Reaction[];
}
