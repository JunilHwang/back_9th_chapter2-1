import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
// import { OrderProduct } from './order-product.entity';
// import { SalesStatistics } from './sales-statistics.entity';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', name: 'stock_quantity' })
  stockQuantity: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  // Relations removed for circular dependency resolution
  // @OneToMany(() => OrderProduct, orderProduct => orderProduct.product)
  // orderProducts: OrderProduct[];

  // @OneToMany(() => SalesStatistics, salesStatistics => salesStatistics.product)
  // salesStatistics: SalesStatistics[];
}
