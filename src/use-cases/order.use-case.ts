import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderFilter,
  OrderItem,
  OrderProductRepository,
  OrderRepository,
  PaymentRepository,
} from '../repositories';
import { CouponRepository } from '../repositories';
import { OrderStatus } from '../entities';
import { PaymentStatus } from '../entities';
import { BalanceUseCase } from './balance.use-case';
import { ProductUseCase } from './product.use-case';
import { CouponUseCase } from './coupon.use-case';

export interface CreateOrderRequest {
  userId: number;
  items: OrderItem[];
  couponId?: number;
}

export interface OrderItemDetail {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface AppliedCoupon {
  couponId: number;
  couponCode: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
}

export interface CreateOrderResponse {
  orderId: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  items: OrderItemDetail[];
  coupon?: AppliedCoupon;
  createdAt: number;
}

export interface ProcessPaymentRequest {
  userId: number;
}

export interface ProcessPaymentResponse {
  paymentId: number;
  orderId: number;
  status: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paidAt: number;
}

export interface GetOrderResponse {
  orderId: number;
  userId: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  items: OrderItemDetail[];
  coupon?: AppliedCoupon;
  payment?: {
    paymentId: number;
    status: string;
    paidAt?: number;
    failureReason?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface OrderSummary {
  orderId: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  itemCount: number;
  createdAt: number;
}

export interface GetUserOrdersResponse {
  items: OrderSummary[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

@Injectable()
export class OrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderProductRepository: OrderProductRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly couponRepository: CouponRepository,
    private readonly balanceUseCase: BalanceUseCase,
    private readonly productUseCase: ProductUseCase,
    private readonly couponUseCase: CouponUseCase,
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    const { userId, items, couponId } = request;

    // 입력 유효성 검증
    if (!items || items.length === 0) {
      throw new BadRequestException('주문할 상품이 없습니다.');
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestException('상품 수량은 1 이상이어야 합니다.');
      }
    }

    // 상품 유효성 검증
    const productIds = items.map((item) => item.productId);
    const products =
      await this.productUseCase.validateProductsForOrder(productIds);

    // 재고 확인
    for (const item of items) {
      await this.productUseCase.checkStockAvailability(
        item.productId,
        item.quantity,
      );
    }

    // 주문 생성
    const order = await this.orderRepository.create({
      userId,
      items,
      couponId,
    });

    // 주문 상품 생성 및 금액 계산
    let totalAmount = 0;
    const orderItems: OrderItemDetail[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;

      // 주문 상품 생성
      await this.orderProductRepository.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        totalPrice,
      });
    }

    // 쿠폰 적용
    let discountAmount = 0;
    let appliedCoupon: AppliedCoupon | undefined;

    if (couponId) {
      const couponResult = await this.couponUseCase.applyCoupon(
        couponId,
        totalAmount,
      );
      discountAmount = couponResult.discountAmount;
      appliedCoupon = {
        couponId: couponResult.couponId,
        couponCode: couponResult.couponCode,
        discountType: couponResult.discountType,
        discountValue: couponResult.discountValue,
        discountAmount: couponResult.discountAmount,
      };
    }

    const finalAmount = totalAmount - discountAmount;

    // 주문 정보 업데이트
    order.totalAmount = totalAmount;
    order.discountAmount = discountAmount;
    order.finalAmount = finalAmount;
    await this.orderRepository.save(order);

    return {
      orderId: order.id,
      status: order.status,
      totalAmount,
      discountAmount,
      finalAmount,
      items: orderItems,
      coupon: appliedCoupon,
      createdAt: order.createdAt.getTime(),
    };
  }

  async processPayment(
    orderId: number,
    request: ProcessPaymentRequest,
  ): Promise<ProcessPaymentResponse> {
    const { userId } = request;

    // 주문 조회
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 주문 소유자 확인
    if (order.userId !== userId) {
      throw new BadRequestException('주문 소유자가 아닙니다.');
    }

    // 주문 상태 확인
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('이미 처리된 주문입니다.');
    }

    // 기존 결제 확인
    const existingPayment = await this.paymentRepository.findByOrderId(orderId);
    if (existingPayment) {
      throw new BadRequestException('이미 결제가 진행된 주문입니다.');
    }

    // 잔액 확인
    const balance = await this.balanceUseCase.getBalance(userId);
    if (balance.currentBalance < order.finalAmount) {
      throw new BadRequestException('잔액이 부족합니다.');
    }

    try {
      // 재고 차감
      const orderProducts =
        await this.orderProductRepository.findByOrderId(orderId);
      for (const orderProduct of orderProducts) {
        await this.productUseCase.decreaseStock(
          orderProduct.productId,
          orderProduct.quantity,
        );
      }

      // 잔액 차감
      await this.balanceUseCase.deductBalance(
        userId,
        order.finalAmount,
        `주문 ${orderId} 결제`,
      );

      // 쿠폰 사용 처리
      if (order.couponId) {
        await this.couponUseCase.markCouponAsUsed(order.couponId);
      }

      // 결제 정보 생성
      const payment = await this.paymentRepository.create({
        orderId,
        status: PaymentStatus.SUCCESS,
        amount: order.finalAmount,
        balanceBefore: balance.currentBalance,
        balanceAfter: balance.currentBalance - order.finalAmount,
        failureReason: null,
      });

      // 주문 상태 업데이트
      await this.orderRepository.updateStatus(orderId, OrderStatus.COMPLETED);

      return {
        paymentId: payment.id,
        orderId,
        status: payment.status,
        amount: payment.amount,
        balanceBefore: payment.balanceBefore,
        balanceAfter: payment.balanceAfter,
        paidAt: payment.createdAt.getTime(),
      };
    } catch (error) {
      // 결제 실패 처리
      await this.paymentRepository.create({
        orderId,
        status: PaymentStatus.FAILED,
        amount: order.finalAmount,
        balanceBefore: balance.currentBalance,
        balanceAfter: balance.currentBalance,
        failureReason: error.message,
      });

      // 주문 상태 업데이트
      await this.orderRepository.updateStatus(orderId, OrderStatus.FAILED);

      throw error;
    }
  }

  async getOrder(orderId: number): Promise<GetOrderResponse> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 주문 상품 조회
    const orderProducts =
      await this.orderProductRepository.findByOrderId(orderId);
    const productIds = orderProducts.map((op) => op.productId);
    const products =
      await this.productUseCase.validateProductsForOrder(productIds);

    const items: OrderItemDetail[] = orderProducts.map((op) => {
      const product = products.find((p) => p.id === op.productId);
      return {
        productId: op.productId,
        productName: product?.name || 'Unknown Product',
        unitPrice: op.unitPrice,
        quantity: op.quantity,
        totalPrice: op.totalPrice,
      };
    });

    // 쿠폰 정보 조회
    let appliedCoupon: AppliedCoupon | undefined;
    if (order.couponId) {
      const coupon = await this.couponRepository.findById(order.couponId);
      if (coupon) {
        appliedCoupon = {
          couponId: coupon.id,
          couponCode: coupon.couponCode,
          discountType: 'PERCENTAGE', // Mock data
          discountValue: 10, // Mock data
          discountAmount: order.discountAmount,
        };
      }
    }

    // 결제 정보 조회
    const payment = await this.paymentRepository.findByOrderId(orderId);
    const paymentInfo = payment
      ? {
          paymentId: payment.id,
          status: payment.status,
          paidAt: payment.createdAt.getTime(),
          failureReason: payment.failureReason,
        }
      : undefined;

    return {
      orderId: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      items,
      coupon: appliedCoupon,
      payment: paymentInfo,
      createdAt: order.createdAt.getTime(),
      updatedAt: order.updatedAt.getTime(),
    };
  }

  async getUserOrders(
    userId: number,
    filter: OrderFilter,
  ): Promise<GetUserOrdersResponse> {
    const result = await this.orderRepository.findByUserId(userId, filter);

    const items: OrderSummary[] = await Promise.all(
      result.items.map(async (order) => {
        const orderProducts = await this.orderProductRepository.findByOrderId(
          order.id,
        );
        return {
          orderId: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          discountAmount: order.discountAmount,
          finalAmount: order.finalAmount,
          itemCount: orderProducts.length,
          createdAt: order.createdAt.getTime(),
        };
      }),
    );

    return {
      items,
      pagination: {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
      },
    };
  }
}
