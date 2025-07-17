import {
  Coupon,
  CouponEvent,
  CouponEventStatus,
  CouponStatus,
} from '../entities';

export interface CouponFilter {
  userId?: number;
  status?: CouponStatus;
  page?: number;
  size?: number;
}

export interface CouponListResult {
  items: Coupon[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IssueCouponData {
  userId: number;
  couponEventId: number;
}

export abstract class CouponRepository {
  abstract findById(id: number): Promise<Coupon | null>;

  abstract findByUserId(
    userId: number,
    filter: CouponFilter,
  ): Promise<CouponListResult>;

  abstract findByUserIdAndStatus(
    userId: number,
    status: CouponStatus,
  ): Promise<Coupon[]>;

  abstract findByCouponCode(couponCode: string): Promise<Coupon | null>;

  abstract save(coupon: Coupon): Promise<Coupon>;

  abstract create(couponData: Partial<Coupon>): Promise<Coupon>;

  abstract updateStatus(id: number, status: CouponStatus): Promise<Coupon>;

  abstract markAsUsed(id: number, usedAt: Date): Promise<Coupon>;

  abstract findExpiredCoupons(): Promise<Coupon[]>;

  abstract bulkUpdateStatus(ids: number[], status: CouponStatus): Promise<void>;
}

export abstract class CouponEventRepository {
  abstract findById(id: number): Promise<CouponEvent | null>;

  abstract findByStatus(status: CouponEventStatus): Promise<CouponEvent[]>;

  abstract findActiveEvents(): Promise<CouponEvent[]>;

  abstract save(couponEvent: CouponEvent): Promise<CouponEvent>;

  abstract create(couponEventData: Partial<CouponEvent>): Promise<CouponEvent>;

  abstract updateIssuedQuantity(
    id: number,
    quantity: number,
  ): Promise<CouponEvent>;

  abstract increaseIssuedQuantity(id: number): Promise<CouponEvent>;

  abstract findAvailableForIssue(
    couponEventId: number,
  ): Promise<CouponEvent | null>;

  abstract issueCoupon(data: IssueCouponData): Promise<Coupon>;
}
