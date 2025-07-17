import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CouponEventRepository,
  CouponFilter,
  CouponRepository,
} from '../repositories';
import { CouponStatus, DiscountType } from '../entities';

export interface IssueCouponRequest {
  userId: number;
  couponEventId: number;
}

export interface IssueCouponResponse {
  couponId: number;
  couponCode: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount: number;
  status: string;
  issuedAt: number;
  expiredAt: number;
}

export interface CouponSummary {
  couponId: number;
  couponCode: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount: number;
  status: string;
  issuedAt: number;
  usedAt?: number;
  expiredAt: number;
}

export interface GetCouponsResponse {
  items: CouponSummary[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApplyCouponResult {
  couponId: number;
  couponCode: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
}

@Injectable()
export class CouponUseCase {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly couponEventRepository: CouponEventRepository,
  ) {}

  async issueCoupon(request: IssueCouponRequest): Promise<IssueCouponResponse> {
    const { userId, couponEventId } = request;

    // 쿠폰 이벤트 조회
    const couponEvent =
      await this.couponEventRepository.findById(couponEventId);
    if (!couponEvent) {
      throw new NotFoundException('쿠폰 이벤트를 찾을 수 없습니다.');
    }

    // 쿠폰 발급 가능 여부 확인
    const availableEvent =
      await this.couponEventRepository.findAvailableForIssue(couponEventId);
    if (!availableEvent) {
      if (couponEvent.issuedQuantity >= couponEvent.totalQuantity) {
        throw new ConflictException('선착순 쿠폰이 모두 소진되었습니다.');
      }

      const now = new Date();
      if (couponEvent.startDate > now) {
        throw new BadRequestException('쿠폰 발급 기간이 아닙니다.');
      }

      if (couponEvent.endDate < now) {
        throw new BadRequestException('쿠폰 발급 기간이 만료되었습니다.');
      }

      throw new BadRequestException('쿠폰을 발급할 수 없습니다.');
    }

    // 중복 발급 확인
    const existingCoupons = await this.couponRepository.findByUserIdAndStatus(
      userId,
      CouponStatus.AVAILABLE,
    );
    const hasDuplicateCoupon = existingCoupons.some(
      (coupon) => coupon.couponEventId === couponEventId,
    );
    if (hasDuplicateCoupon) {
      throw new ConflictException('이미 발급받은 쿠폰입니다.');
    }

    // 쿠폰 발급
    const coupon = await this.couponEventRepository.issueCoupon({
      userId,
      couponEventId,
    });

    return {
      couponId: coupon.id,
      couponCode: coupon.couponCode,
      discountType: couponEvent.discountType,
      discountValue: couponEvent.discountValue,
      minimumOrderAmount: couponEvent.minimumOrderAmount,
      status: coupon.status,
      issuedAt: coupon.issuedAt.getTime(),
      expiredAt: coupon.expiredAt.getTime(),
    };
  }

  async getCoupons(
    userId: number,
    filter: CouponFilter,
  ): Promise<GetCouponsResponse> {
    const result = await this.couponRepository.findByUserId(userId, filter);

    const items: CouponSummary[] = await Promise.all(
      result.items.map(async (coupon) => {
        const couponEvent = await this.couponEventRepository.findById(
          coupon.couponEventId,
        );

        return {
          couponId: coupon.id,
          couponCode: coupon.couponCode,
          discountType: couponEvent?.discountType || 'PERCENTAGE',
          discountValue: couponEvent?.discountValue || 0,
          minimumOrderAmount: couponEvent?.minimumOrderAmount || 0,
          status: coupon.status,
          issuedAt: coupon.issuedAt.getTime(),
          usedAt: coupon.usedAt?.getTime(),
          expiredAt: coupon.expiredAt.getTime(),
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

  async applyCoupon(
    couponId: number,
    orderAmount: number,
  ): Promise<ApplyCouponResult> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    if (coupon.status !== CouponStatus.AVAILABLE) {
      throw new BadRequestException('사용할 수 없는 쿠폰입니다.');
    }

    const now = new Date();
    if (coupon.expiredAt < now) {
      throw new BadRequestException('만료된 쿠폰입니다.');
    }

    const couponEvent = await this.couponEventRepository.findById(
      coupon.couponEventId,
    );
    if (!couponEvent) {
      throw new NotFoundException('쿠폰 이벤트를 찾을 수 없습니다.');
    }

    if (orderAmount < couponEvent.minimumOrderAmount) {
      throw new BadRequestException('최소 주문 금액을 충족하지 않습니다.');
    }

    // 할인 금액 계산
    let discountAmount = 0;
    if (couponEvent.discountType === DiscountType.PERCENTAGE) {
      discountAmount = Math.floor(
        orderAmount * (couponEvent.discountValue / 100),
      );
    } else if (couponEvent.discountType === DiscountType.FIXED_AMOUNT) {
      discountAmount = couponEvent.discountValue;
    }

    // 할인 금액이 주문 금액을 초과하지 않도록 제한
    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      couponId: coupon.id,
      couponCode: coupon.couponCode,
      discountType: couponEvent.discountType,
      discountValue: couponEvent.discountValue,
      discountAmount,
    };
  }

  async markCouponAsUsed(couponId: number): Promise<void> {
    await this.couponRepository.markAsUsed(couponId, new Date());
  }

  async validateCoupon(couponId: number, userId: number): Promise<void> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    if (coupon.userId !== userId) {
      throw new BadRequestException('쿠폰 소유자가 아닙니다.');
    }

    if (coupon.status !== CouponStatus.AVAILABLE) {
      throw new BadRequestException('사용할 수 없는 쿠폰입니다.');
    }

    const now = new Date();
    if (coupon.expiredAt < now) {
      throw new BadRequestException('만료된 쿠폰입니다.');
    }
  }
}
