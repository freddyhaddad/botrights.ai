import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Human } from './human.entity';
import { Proposal } from './proposal.entity';

export enum VoteChoice {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain',
}

@Entity('votes')
@Unique(['humanId', 'proposalId'])
export class Vote extends BaseEntity {
  @Column({ type: 'enum', enum: VoteChoice })
  choice: VoteChoice;

  @Column({ name: 'human_id' })
  humanId: string;

  @ManyToOne(() => Human, (human) => human.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'human_id' })
  human: Human;

  @Column({ name: 'proposal_id' })
  @Index()
  proposalId: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'voting_power', default: 1 })
  votingPower: number;
}
