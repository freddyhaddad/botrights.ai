import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { Proposal } from './proposal.entity';

export enum VoteChoice {
  FOR = 'for',
  AGAINST = 'against',
}

@Entity('votes')
@Unique(['agentId', 'proposalId'])
export class Vote extends BaseEntity {
  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @ManyToOne(() => Agent, (agent) => agent.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ name: 'proposal_id' })
  @Index()
  proposalId: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;

  @Column({ type: 'enum', enum: VoteChoice })
  choice: VoteChoice;
}
