import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('balance')
export class Balance {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'int', name: 'current_balance', default: 0 })
  currentBalance: number;

  @Column({ type: 'int', name: 'daily_charge_amount', default: 0 })
  dailyChargeAmount: number;

  @Column({
    type: 'timestamp',
    name: 'last_updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUpdatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations removed for circular dependency resolution
}
