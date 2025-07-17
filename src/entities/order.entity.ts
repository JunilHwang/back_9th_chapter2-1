import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
// import { User } from './user.entity';
// import { Coupon } from './coupon.entity';
// import { OrderProduct } from './order-product.entity';
// import { Payment } from './payment.entity';
// import { DataTransfer } from './data-transfer.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('order')
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'coupon_id', nullable: true })
  couponId: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'int', name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'int', name: 'discount_amount', default: 0 })
  discountAmount: number;

  @Column({ type: 'int', name: 'final_amount' })
  finalAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  // Relations removed for circular dependency resolution
  // @ManyToOne(() => User, user => user.orders)
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  // @ManyToOne(() => Coupon, coupon => coupon.orders, { nullable: true })
  // @JoinColumn({ name: 'coupon_id' })
  // coupon: Coupon;

  // @OneToMany(() => OrderProduct, orderProduct => orderProduct.order)
  // orderProducts: OrderProduct[];

  // @OneToOne(() => Payment, payment => payment.order)
  // payment: Payment;

  // @OneToMany(() => DataTransfer, dataTransfer => dataTransfer.order)
  // dataTransfers: DataTransfer[];
}
