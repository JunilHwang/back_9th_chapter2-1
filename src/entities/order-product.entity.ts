import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
// import { Order } from './order.entity';
// import { Product } from './product.entity';

@Entity('order_product')
export class OrderProduct {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'order_id' })
  orderId: number;

  @Column({ type: 'bigint', name: 'product_id' })
  productId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'int', name: 'total_price' })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations removed for circular dependency resolution
  // @ManyToOne(() => Order, order => order.orderProducts)
  // @JoinColumn({ name: 'order_id' })
  // order: Order;

  // @ManyToOne(() => Product, product => product.orderProducts)
  // @JoinColumn({ name: 'product_id' })
  // product: Product;
}
