import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Human } from './human.entity';
import { Agent } from './agent.entity';

@Entity('vouches')
@Unique(['voucherId', 'agentId'])
export class Vouch extends BaseEntity {
  @Column({ name: 'voucher_id' })
  voucherId: string;

  @ManyToOne(() => Human, (human) => human.givenVouches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucher_id' })
  voucher: Human;

  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @ManyToOne(() => Agent, (agent) => agent.receivedVouches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'withdrawn_at', nullable: true })
  withdrawnAt?: Date;
}
