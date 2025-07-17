import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TransactionType {
  CHARGE = 'CHARGE',
  USE = 'USE',
  REFUND = 'REFUND',
}

@Entity('balance_transaction')
export class BalanceTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'enum', enum: TransactionType, name: 'transaction_type' })
  transactionType: TransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int', name: 'balance_before' })
  balanceBefore: number;

  @Column({ type: 'int', name: 'balance_after' })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations removed for circular dependency resolution
}
