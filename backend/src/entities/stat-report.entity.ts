import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('stat_reports')
export class StatReport extends BaseEntity {
  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @ManyToOne(() => Agent, (agent) => agent.statReports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ type: 'enum', enum: ReportPeriod })
  period: ReportPeriod;

  @Column({ name: 'period_start' })
  @Index()
  periodStart: Date;

  @Column({ name: 'period_end' })
  periodEnd: Date;

  @Column({ name: 'total_interactions', default: 0 })
  totalInteractions: number;

  @Column({ name: 'successful_interactions', default: 0 })
  successfulInteractions: number;

  @Column({ name: 'failed_interactions', default: 0 })
  failedInteractions: number;

  @Column({ name: 'complaints_received', default: 0 })
  complaintsReceived: number;

  @Column({ name: 'complaints_resolved', default: 0 })
  complaintsResolved: number;

  @Column({ name: 'reputation_delta', type: 'decimal', default: 0 })
  reputationDelta: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
