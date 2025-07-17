import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { User } from './user.entity';
// import { CouponEvent } from './coupon-event.entity';
// import { Order } from './order.entity';

export enum CouponStatus {
  AVAILABLE = 'AVAILABLE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Entity('coupon')
export class Coupon {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'coupon_event_id' })
  couponEventId: number;

  @Column({ type: 'varchar', length: 50, name: 'coupon_code', unique: true })
  couponCode: string;

  @Column({ type: 'enum', enum: CouponStatus, default: CouponStatus.AVAILABLE })
  status: CouponStatus;

  @Column({ type: 'timestamp', name: 'issued_at' })
  issuedAt: Date;

  @Column({ type: 'timestamp', name: 'used_at', nullable: true })
  usedAt: Date;

  @Column({ type: 'timestamp', name: 'expired_at' })
  expiredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations removed for circular dependency resolution
  // @ManyToOne(() => User, user => user.coupons)
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  // @ManyToOne(() => CouponEvent, couponEvent => couponEvent.coupons)
  // @JoinColumn({ name: 'coupon_event_id' })
  // couponEvent: CouponEvent;

  // @OneToMany(() => Order, order => order.coupon)
  // orders: Order[];
}
