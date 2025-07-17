import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
// import { Coupon } from './coupon.entity';

export enum CouponEventStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

@Entity('coupon_event')
export class CouponEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: DiscountType, name: 'discount_type' })
  discountType: DiscountType;

  @Column({ type: 'int', name: 'discount_value' })
  discountValue: number;

  @Column({ type: 'int', name: 'total_quantity' })
  totalQuantity: number;

  @Column({ type: 'int', name: 'issued_quantity', default: 0 })
  issuedQuantity: number;

  @Column({ type: 'int', name: 'minimum_order_amount', default: 0 })
  minimumOrderAmount: number;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: CouponEventStatus,
    default: CouponEventStatus.ACTIVE,
  })
  status: CouponEventStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  // Relations removed for circular dependency resolution
  // @OneToMany(() => Coupon, coupon => coupon.couponEvent)
  // coupons: Coupon[];
}
