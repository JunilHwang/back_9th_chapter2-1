import {
  Order,
  OrderProduct,
  OrderStatus,
  Payment,
  PaymentStatus,
} from '../entities';

export interface OrderFilter {
  userId?: number;
  status?: OrderStatus;
  page?: number;
  size?: number;
  sortBy?: 'createdAt' | 'finalAmount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface OrderListResult {
  items: Order[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderData {
  userId: number;
  items: OrderItem[];
  couponId?: number;
}

export abstract class OrderRepository {
  abstract findById(id: number): Promise<Order | null>;

  abstract findByUserId(
    userId: number,
    filter: OrderFilter,
  ): Promise<OrderListResult>;

  abstract findAll(filter: OrderFilter): Promise<OrderListResult>;

  abstract save(order: Order): Promise<Order>;

  abstract create(orderData: CreateOrderData): Promise<Order>;

  abstract updateStatus(id: number, status: OrderStatus): Promise<Order>;

  abstract findByStatus(status: OrderStatus): Promise<Order[]>;

  abstract delete(id: number): Promise<void>;
}

export abstract class OrderProductRepository {
  abstract findByOrderId(orderId: number): Promise<OrderProduct[]>;

  abstract findByProductId(productId: number): Promise<OrderProduct[]>;

  abstract save(orderProduct: OrderProduct): Promise<OrderProduct>;

  abstract create(
    orderProductData: Partial<OrderProduct>,
  ): Promise<OrderProduct>;

  abstract bulkCreate(
    orderProducts: Partial<OrderProduct>[],
  ): Promise<OrderProduct[]>;

  abstract findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<OrderProduct[]>;
}

export abstract class PaymentRepository {
  abstract findById(id: number): Promise<Payment | null>;

  abstract findByOrderId(orderId: number): Promise<Payment | null>;

  abstract save(payment: Payment): Promise<Payment>;

  abstract create(paymentData: Partial<Payment>): Promise<Payment>;

  abstract updateStatus(id: number, status: PaymentStatus): Promise<Payment>;

  abstract findByStatus(status: PaymentStatus): Promise<Payment[]>;

  abstract findByUserId(userId: number): Promise<Payment[]>;
}
