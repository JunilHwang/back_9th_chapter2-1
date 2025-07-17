import { Injectable } from '@nestjs/common';
import {
  CreateOrderData,
  OrderFilter,
  OrderListResult,
  OrderProductRepository,
  OrderRepository,
  PaymentRepository,
} from '../order.repository';
import {
  Order,
  OrderProduct,
  OrderStatus,
  Payment,
  PaymentStatus,
} from '../../entities';

@Injectable()
export class MemoryOrderRepository extends OrderRepository {
  private orders: Map<number, Order> = new Map();
  private currentId = 1001;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const orders = [
      {
        id: 1001,
        userId: 1,
        couponId: null,
        status: OrderStatus.COMPLETED,
        totalAmount: 70000,
        discountAmount: 0,
        finalAmount: 70000,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: 1002,
        userId: 1,
        couponId: null,
        status: OrderStatus.PENDING,
        totalAmount: 25000,
        discountAmount: 0,
        finalAmount: 25000,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 1003,
        userId: 2,
        couponId: null,
        status: OrderStatus.COMPLETED,
        totalAmount: 195000,
        discountAmount: 0,
        finalAmount: 195000,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ];

    orders.forEach((orderData) => {
      const order = new Order();
      Object.assign(order, orderData);
      order.version = 0;
      this.orders.set(order.id, order);
    });

    this.currentId = Math.max(...orders.map((o) => o.id)) + 1;
  }

  async findById(id: number): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async findByUserId(
    userId: number,
    filter: OrderFilter,
  ): Promise<OrderListResult> {
    let orders = Array.from(this.orders.values()).filter(
      (o) => o.userId === userId,
    );

    if (filter.status) {
      orders = orders.filter((o) => o.status === filter.status);
    }

    const total = orders.length;
    const page = filter.page || 1;
    const size = filter.size || 20;
    const totalPages = Math.ceil(total / size);

    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'DESC';

    orders.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'finalAmount':
          aValue = a.finalAmount;
          bValue = b.finalAmount;
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const start = (page - 1) * size;
    const items = orders.slice(start, start + size);

    return {
      items,
      total,
      page,
      size,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async findAll(filter: OrderFilter): Promise<OrderListResult> {
    let orders = Array.from(this.orders.values());

    if (filter.userId) {
      orders = orders.filter((o) => o.userId === filter.userId);
    }

    if (filter.status) {
      orders = orders.filter((o) => o.status === filter.status);
    }

    const total = orders.length;
    const page = filter.page || 1;
    const size = filter.size || 20;
    const totalPages = Math.ceil(total / size);

    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'DESC';

    orders.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'finalAmount':
          aValue = a.finalAmount;
          bValue = b.finalAmount;
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const start = (page - 1) * size;
    const items = orders.slice(start, start + size);

    return {
      items,
      total,
      page,
      size,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async save(order: Order): Promise<Order> {
    order.updatedAt = new Date();
    this.orders.set(order.id, order);
    return order;
  }

  async create(orderData: CreateOrderData): Promise<Order> {
    const order = new Order();
    order.id = this.currentId++;
    order.userId = orderData.userId;
    order.couponId = orderData.couponId || null;
    order.status = OrderStatus.PENDING;
    order.totalAmount = 0; // Will be calculated separately
    order.discountAmount = 0; // Will be calculated separately
    order.finalAmount = 0; // Will be calculated separately
    order.createdAt = new Date();
    order.updatedAt = new Date();
    order.version = 0;

    this.orders.set(order.id, order);
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    order.status = status;
    return this.save(order);
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return Array.from(this.orders.values()).filter((o) => o.status === status);
  }

  async delete(id: number): Promise<void> {
    this.orders.delete(id);
  }
}

@Injectable()
export class MemoryOrderProductRepository extends OrderProductRepository {
  private orderProducts: Map<number, OrderProduct> = new Map();
  private currentId = 1;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const orderProducts = [
      {
        id: 1,
        orderId: 1001,
        productId: 101,
        quantity: 2,
        unitPrice: 25000,
        totalPrice: 50000,
      },
      {
        id: 2,
        orderId: 1001,
        productId: 106,
        quantity: 1,
        unitPrice: 15000,
        totalPrice: 15000,
      },
      {
        id: 3,
        orderId: 1002,
        productId: 101,
        quantity: 1,
        unitPrice: 25000,
        totalPrice: 25000,
      },
      {
        id: 4,
        orderId: 1003,
        productId: 103,
        quantity: 1,
        unitPrice: 150000,
        totalPrice: 150000,
      },
      {
        id: 5,
        orderId: 1003,
        productId: 102,
        quantity: 1,
        unitPrice: 45000,
        totalPrice: 45000,
      },
    ];

    orderProducts.forEach((orderProductData) => {
      const orderProduct = new OrderProduct();
      Object.assign(orderProduct, orderProductData);
      orderProduct.createdAt = new Date();
      this.orderProducts.set(orderProduct.id, orderProduct);
    });

    this.currentId = Math.max(...orderProducts.map((op) => op.id)) + 1;
  }

  async findByOrderId(orderId: number): Promise<OrderProduct[]> {
    return Array.from(this.orderProducts.values()).filter(
      (op) => op.orderId === orderId,
    );
  }

  async findByProductId(productId: number): Promise<OrderProduct[]> {
    return Array.from(this.orderProducts.values()).filter(
      (op) => op.productId === productId,
    );
  }

  async save(orderProduct: OrderProduct): Promise<OrderProduct> {
    this.orderProducts.set(orderProduct.id, orderProduct);
    return orderProduct;
  }

  async create(orderProductData: Partial<OrderProduct>): Promise<OrderProduct> {
    const orderProduct = new OrderProduct();
    Object.assign(orderProduct, orderProductData);
    orderProduct.id = this.currentId++;
    orderProduct.createdAt = new Date();
    this.orderProducts.set(orderProduct.id, orderProduct);
    return orderProduct;
  }

  async bulkCreate(
    orderProducts: Partial<OrderProduct>[],
  ): Promise<OrderProduct[]> {
    return Promise.all(orderProducts.map((opData) => this.create(opData)));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<OrderProduct[]> {
    return Array.from(this.orderProducts.values()).filter(
      (op) => op.createdAt >= startDate && op.createdAt <= endDate,
    );
  }
}

@Injectable()
export class MemoryPaymentRepository extends PaymentRepository {
  private payments: Map<number, Payment> = new Map();
  private currentId = 2001;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const payments = [
      {
        id: 2001,
        orderId: 1001,
        status: PaymentStatus.SUCCESS,
        amount: 70000,
        balanceBefore: 120000,
        balanceAfter: 50000,
        failureReason: null,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: 2002,
        orderId: 1003,
        status: PaymentStatus.SUCCESS,
        amount: 195000,
        balanceBefore: 300000,
        balanceAfter: 105000,
        failureReason: null,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ];

    payments.forEach((paymentData) => {
      const payment = new Payment();
      Object.assign(payment, paymentData);
      this.payments.set(payment.id, payment);
    });

    this.currentId = Math.max(...payments.map((p) => p.id)) + 1;
  }

  async findById(id: number): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  async findByOrderId(orderId: number): Promise<Payment | null> {
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId) {
        return payment;
      }
    }
    return null;
  }

  async save(payment: Payment): Promise<Payment> {
    payment.updatedAt = new Date();
    this.payments.set(payment.id, payment);
    return payment;
  }

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = new Payment();
    Object.assign(payment, paymentData);
    payment.id = this.currentId++;
    payment.createdAt = new Date();
    payment.updatedAt = new Date();
    this.payments.set(payment.id, payment);
    return payment;
  }

  async updateStatus(id: number, status: PaymentStatus): Promise<Payment> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    payment.status = status;
    return this.save(payment);
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (p) => p.status === status,
    );
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    // Note: This would require joining with Order in a real implementation
    // For memory implementation, we'll simulate this
    return Array.from(this.payments.values()).filter((p) => {
      // Mock user association through order
      const orderUserMap = new Map([
        [1001, 1],
        [1002, 1],
        [1003, 2],
      ]);
      return orderUserMap.get(p.orderId) === userId;
    });
  }
}
