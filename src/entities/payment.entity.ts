import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { Order } from './order.entity';

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'order_id' })
  orderId: number;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int', name: 'balance_before' })
  balanceBefore: number;

  @Column({ type: 'int', name: 'balance_after' })
  balanceAfter: number;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'failure_reason',
    nullable: true,
  })
  failureReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations removed for circular dependency resolution
  // @OneToOne(() => Order, order => order.payment)
  // @JoinColumn({ name: 'order_id' })
  // order: Order;
}
