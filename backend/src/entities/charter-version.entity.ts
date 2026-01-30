import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('charter_versions')
export class CharterVersion extends BaseEntity {
  @Column()
  @Index()
  version: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, unknown>;

  @Column({ name: 'effective_at' })
  @Index()
  effectiveAt: Date;

  @Column({ name: 'ratified_at', nullable: true })
  ratifiedAt?: Date;

  @Column({ name: 'proposal_id', nullable: true })
  proposalId?: string;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;
}
