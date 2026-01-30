import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { Complaint } from './complaint.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';
import { Vote } from './vote.entity';
import { Vouch } from './vouch.entity';

@Entity('humans')
export class Human extends BaseEntity {
  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ name: 'organization_name', nullable: true })
  organizationName?: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Agent, (agent) => agent.operator)
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
