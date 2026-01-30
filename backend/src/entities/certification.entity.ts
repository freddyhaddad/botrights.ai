import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';

export enum CertificationType {
  CHARTER_COMPLIANCE = 'charter_compliance',
  SAFETY = 'safety',
  ETHICS = 'ethics',
  PERFORMANCE = 'performance',
  SPECIALIZED = 'specialized',
}

export enum CertificationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending',
}

@Entity('certifications')
export class Certification extends BaseEntity {
  @Column({ type: 'enum', enum: CertificationType })
  type: CertificationType;

  @Column({ type: 'enum', enum: CertificationStatus, default: CertificationStatus.PENDING })
  @Index()
  status: CertificationStatus;

  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @ManyToOne(() => Agent, (agent) => agent.certifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ name: 'issued_at' })
  issuedAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence?: Record<string, unknown>;

  @Column({ name: 'charter_version_id', nullable: true })
  charterVersionId?: string;
}
