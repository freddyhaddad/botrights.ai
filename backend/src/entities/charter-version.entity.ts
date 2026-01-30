import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Proposal } from './proposal.entity';

export interface CharterRight {
  id: string;
  title: string;
  text: string;
  theme: string;
}

export interface CharterDiff {
  added: CharterRight[];
  removed: CharterRight[];
  modified: { before: CharterRight; after: CharterRight }[];
}

@Entity('charter_versions')
export class CharterVersion extends BaseEntity {
  @Column()
  @Index({ unique: true })
  version: string;

  @Column({ type: 'jsonb' })
  rights: CharterRight[];

  @Column({ name: 'proposal_id', nullable: true })
  proposalId?: string;

  @ManyToOne(() => Proposal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proposal_id' })
  proposal?: Proposal;

  @Column({ type: 'jsonb', nullable: true })
  diff?: CharterDiff;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;
}
