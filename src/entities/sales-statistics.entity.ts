import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { Product } from './product.entity';

@Entity('sales_statistics')
export class SalesStatistics {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'product_id' })
  productId: number;

  @Column({ type: 'date', name: 'statistics_date' })
  statisticsDate: Date;

  @Column({ type: 'int', name: 'sales_quantity' })
  salesQuantity: number;

  @Column({ type: 'int', name: 'sales_amount' })
  salesAmount: number;

  @Column({ type: 'int', name: 'rank_position' })
  rankPosition: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations removed for circular dependency resolution
  // @ManyToOne(() => Product, (product) => product.salesStatistics)
  // @JoinColumn({ name: 'product_id' })
  // product: Product;
}
