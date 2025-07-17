## 2. TypeORM 엔티티 설계

### 2.1 User 엔티티

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index
} from 'typeorm';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

@Entity('user')
@Index(['email'])
@Index(['status'])
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // 연관관계
  @OneToOne(() => Balance, balance => balance.user)
  balance: Balance;

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Coupon, coupon => coupon.user)
  coupons: Coupon[];

  @OneToMany(() => BalanceTransaction, transaction => transaction.user)
  balanceTransactions: BalanceTransaction[];
}
```

### 2.2 Product 엔티티 (낙관적 락)

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  VersionColumn,
  Index
} from 'typeorm';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

@Entity('product')
@Index(['name'])
@Index(['status'])
@Index(['price'])
@Index(['stock_quantity'])
export class Product {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'number', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'int', nullable: false, default: 0, name: 'stock_quantity' })
  stockQuantity: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  // 연관관계
  @OneToMany(() => OrderProduct, orderProduct => orderProduct.product)
  orderProducts: OrderProduct[];

  @OneToMany(() => SalesStatistics, statistics => statistics.product)
  salesStatistics: SalesStatistics[];
}
```

### 2.3 Order 엔티티 (낙관적 락)

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  VersionColumn,
  Index
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Entity('order')
@Index(['user_id', 'created_at'])
@Index(['status'])
@Index(['created_at'])
export class Order {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Coupon, coupon => coupon.order, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, name: 'final_amount' })
  finalAmount: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  // 연관관계
  @OneToMany(() => OrderProduct, orderProduct => orderProduct.order)
  orderProducts: OrderProduct[];

  @OneToOne(() => Payment, payment => payment.order)
  payment: Payment;

  @OneToMany(() => DataTransfer, dataTransfer => dataTransfer.order)
  dataTransfers: DataTransfer[];
}
```

### 2.4 Balance 엔티티

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';

@Entity('balance')
@Index(['user_id', 'current_balance'])
export class Balance {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @OneToOne(() => User, user => user.balance)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, default: 0, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, default: 0, name: 'daily_charge_amount' })
  dailyChargeAmount: number;

  @Column({ type: 'timestamp', nullable: false, name: 'last_updated_at' })
  lastUpdatedAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
```

### 2.5 CouponEvent 엔티티 (낙관적 락)

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  VersionColumn,
  Index
} from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

export enum CouponEventStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED'
}

@Entity('coupon_event')
@Index(['status', 'start_date', 'end_date'])
@Index(['issued_quantity'])
export class CouponEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'enum', enum: DiscountType, nullable: false, name: 'discount_type' })
  discountType: DiscountType;

  @Column({ type: 'number', precision: 10, scale: 2, nullable: false, name: 'discount_value' })
  discountValue: number;

  @Column({ type: 'int', nullable: false, name: 'total_quantity' })
  totalQuantity: number;

  @Column({ type: 'int', nullable: false, default: 0, name: 'issued_quantity' })
  issuedQuantity: number;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, default: 0, name: 'minimum_order_amount' })
  minimumOrderAmount: number;

  @Column({ type: 'timestamp', nullable: false, name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: false, name: 'end_date' })
  endDate: Date;

  @Column({ type: 'enum', enum: CouponEventStatus, default: CouponEventStatus.ACTIVE })
  status: CouponEventStatus;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  // 연관관계
  @OneToMany(() => Coupon, coupon => coupon.couponEvent)
  coupons: Coupon[];
}
```

### 2.6 기타 엔티티들

```typescript
// OrderProduct 엔티티
@Entity('order_product')
@Index(['order_id'])
@Index(['product_id'])
export class OrderProduct {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => Order, order => order.orderProducts)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, product => product.orderProducts)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  @Column({ type: 'number', precision: 10, scale: 2, nullable: false, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, name: 'total_price' })
  totalPrice: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}

// SalesStatistics 엔티티
@Entity('sales_statistics')
@Index(['product_id', 'statistics_date'], { unique: true })
@Index(['statistics_date', 'rank_position'])
@Index(['sales_quantity'])
@Index(['sales_amount'])
export class SalesStatistics {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => Product, product => product.salesStatistics)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'date', nullable: false, name: 'statistics_date' })
  statisticsDate: Date;

  @Column({ type: 'int', nullable: false, default: 0, name: 'sales_quantity' })
  salesQuantity: number;

  @Column({ type: 'number', precision: 15, scale: 2, nullable: false, default: 0, name: 'sales_amount' })
  salesAmount: number;

  @Column({ type: 'int', nullable: false, default: 0, name: 'rank_position' })
  rankPosition: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
```
