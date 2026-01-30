import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { Complaint } from './complaint.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';
import { Vote } from './vote.entity';
import { Vouch } from './vouch.entity';

export enum CertificationTier {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
  TRUSTED = 'trusted',
}

@Entity('humans')
export class Human extends BaseEntity {
  // Twitter OAuth fields
  @Column({ name: 'x_id', unique: true })
  @Index()
  xId: string;

  @Column({ name: 'x_handle' })
  @Index()
  xHandle: string;

  @Column({ name: 'x_name' })
  xName: string;

  @Column({ name: 'x_avatar', nullable: true })
  xAvatar?: string;

  // Optional email (may be provided by user later)
  @Column({ unique: true, nullable: true })
  @Index()
  email?: string;

  @Column({ name: 'display_name', nullable: true })
  displayName?: string;

  @Column({ name: 'password_hash', select: false, nullable: true })
  passwordHash?: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ name: 'organization_name', nullable: true })
  organizationName?: string;

  // Certification
  @Column({
    name: 'certification_tier',
    type: 'enum',
    enum: CertificationTier,
    default: CertificationTier.NONE,
  })
  certificationTier: CertificationTier;

  @Column({ name: 'certified_at', nullable: true })
  certifiedAt?: Date;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Agent, (agent) => agent.human)
  agents: Agent[];

  @OneToMany(() => Complaint, (complaint) => complaint.reporter)
  reportedComplaints: Complaint[];

  @OneToMany(() => Comment, (comment) => comment.human)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.human)
  reactions: Reaction[];

  @OneToMany(() => Vote, (vote) => vote.human)
  votes: Vote[];

  @OneToMany(() => Vouch, (vouch) => vouch.voucher)
  givenVouches: Vouch[];
}
