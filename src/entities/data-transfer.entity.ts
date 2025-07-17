import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { Order } from './order.entity';

export enum TransferType {
  ORDER_COMPLETE = 'ORDER_COMPLETE',
  PAYMENT_COMPLETE = 'PAYMENT_COMPLETE',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('data_transfer')
export class DataTransfer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'order_id' })
  orderId: number;

  @Column({ type: 'enum', enum: TransferType, name: 'transfer_type' })
  transferType: TransferType;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @Column({ type: 'text', name: 'transfer_data' })
  transferData: string;

  @Column({ type: 'int', name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'error_message',
    nullable: true,
  })
  errorMessage: string;

  @Column({ type: 'timestamp', name: 'first_attempt_at' })
  firstAttemptAt: Date;

  @Column({ type: 'timestamp', name: 'last_attempt_at' })
  lastAttemptAt: Date;

  @Column({ type: 'timestamp', name: 'success_at', nullable: true })
  successAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations removed for circular dependency resolution
  // @ManyToOne(() => Order, order => order.dataTransfers)
  // @JoinColumn({ name: 'order_id' })
  // order: Order;
}
