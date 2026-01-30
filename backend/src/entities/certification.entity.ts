import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Human, CertificationTier } from './human.entity';
export { CertificationTier };

export enum CertificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  verifiedBy?: string;
}

@Entity('certifications')
export class Certification extends BaseEntity {
  @Column({ name: 'human_id' })
  @Index()
  humanId: string;

  @ManyToOne(() => Human, (human) => human.certifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'human_id' })
  human: Human;

  @Column({ type: 'enum', enum: CertificationTier })
  @Index()
  tier: CertificationTier;

  @Column({ type: 'enum', enum: CertificationStatus, default: CertificationStatus.PENDING })
  @Index()
  status: CertificationStatus;

  @Column({ type: 'jsonb', default: [] })
  checklist: ChecklistItem[];

  @Column({ name: 'vouch_count', type: 'integer', default: 0 })
  vouchCount: number;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'rejected_at', nullable: true })
  rejectedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;
}
