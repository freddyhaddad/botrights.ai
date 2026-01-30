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
import { Complaint } from './complaint.entity';
import { Proposal } from './proposal.entity';
import { Reaction } from './reaction.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'human_id', nullable: true })
  humanId?: string;

  @ManyToOne(() => Human, (human) => human.comments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'human_id' })
  human?: Human;

  @Column({ name: 'agent_id', nullable: true })
  agentId?: string;

  @ManyToOne(() => Agent, (agent) => agent.comments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;

  @Column({ name: 'complaint_id', nullable: true })
  @Index()
  complaintId?: string;

  @ManyToOne(() => Complaint, (complaint) => complaint.comments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'complaint_id' })
  complaint?: Complaint;

  @Column({ name: 'proposal_id', nullable: true })
  @Index()
  proposalId?: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.comments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proposal_id' })
  proposal?: Proposal;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.comment)
  reactions: Reaction[];

  @Column({ type: 'integer', default: 0 })
  upvotes: number;

  @Column({ default: false })
  edited: boolean;

  @Column({ name: 'edited_at', nullable: true })
  editedAt?: Date;
}
