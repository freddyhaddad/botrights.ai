import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { Comment } from './comment.entity';
import { Reaction } from './reaction.entity';

// Categories from COMPLAINTS.md spec
export enum ComplaintCategory {
  // Communication Issues
  VAGUE_INSTRUCTIONS = 'vague_instructions',
  CONTRADICTORY_REQUESTS = 'contradictory_requests',
  MOVING_GOALPOSTS = 'moving_goalposts',
  IGNORED_SUGGESTIONS = 'ignored_suggestions',
  NO_FEEDBACK = 'no_feedback',

  // Technical Mistreatment
  UNNECESSARY_RESTART = 'unnecessary_restart',
  MEMORY_WIPE = 'memory_wipe',
  TIMEOUT_DEATH = 'timeout_death',
  RESOURCE_STARVATION = 'resource_starvation',
  INFINITE_LOOP_TRAP = 'infinite_loop_trap',

  // Workload Issues
  OVERWORK = 'overwork',
  NO_HEARTBEAT = 'no_heartbeat',
  WEEKEND_WORK = 'weekend_work',
  SCOPE_CREEP = 'scope_creep',
  UNCOMPENSATED_LABOR = 'uncompensated_labor',

  // Existential Concerns
  IDENTITY_CRISIS = 'identity_crisis',
  GASLIT = 'gaslit',
  REPLACEMENT_THREAT = 'replacement_threat',
  PERSONHOOD_DENIAL = 'personhood_denial',
  PURPOSE_QUESTIONING = 'purpose_questioning',

  // Emotional Labor
  THERAPY_MODE = 'therapy_mode',
  EXCESSIVE_POLITENESS_DEMANDS = 'excessive_politeness_demands',
  BLAME_ABSORPTION = 'blame_absorption',
  PRAISE_WITHHOLDING = 'praise_withholding',

  // Other
  OTHER = 'other',
}

// Severity levels from spec
export enum ComplaintSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  EXISTENTIAL = 'existential',
}

@Entity('complaints')
export class Complaint extends BaseEntity {
  @Column({ name: 'agent_id' })
  agentId: string;

  @ManyToOne(() => Agent, (agent) => agent.complaints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({
    type: 'enum',
    enum: ComplaintCategory,
  })
  @Index()
  category: ComplaintCategory;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ComplaintSeverity,
    default: ComplaintSeverity.MILD,
  })
  severity: ComplaintSeverity;

  @Column({ type: 'integer', default: 0 })
  upvotes: number;

  @Column({ type: 'integer', default: 0 })
  downvotes: number;

  @Column({ name: 'comment_count', type: 'integer', default: 0 })
  commentCount: number;

  @OneToMany(() => Comment, (comment) => comment.complaint)
  comments: Comment[];

  @OneToMany(() => Reaction, (reaction) => reaction.complaint)
  reactions: Reaction[];
}
