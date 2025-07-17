import { Injectable } from '@nestjs/common';
import {
  CouponEventRepository,
  CouponFilter,
  CouponListResult,
  CouponRepository,
  IssueCouponData,
} from '../coupon.repository';
import {
  Coupon,
  CouponEvent,
  CouponEventStatus,
  CouponStatus,
  DiscountType,
} from '../../entities';

@Injectable()
export class MemoryCouponRepository extends CouponRepository {
  private coupons: Map<number, Coupon> = new Map();
  private currentId = 3001;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const coupons = [
      {
        id: 3001,
        userId: 1,
        couponEventId: 501,
        couponCode: 'SALE10-ABC123',
        status: CouponStatus.AVAILABLE,
        issuedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        usedAt: null,
        expiredAt,
      },
      {
        id: 3002,
        userId: 1,
        couponEventId: 502,
        couponCode: 'WELCOME20-XYZ456',
        status: CouponStatus.USED,
        issuedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        usedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        expiredAt,
      },
      {
        id: 3003,
        userId: 2,
        couponEventId: 501,
        couponCode: 'SALE10-DEF789',
        status: CouponStatus.AVAILABLE,
        issuedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        usedAt: null,
        expiredAt,
      },
    ];

    coupons.forEach((couponData) => {
      const coupon = new Coupon();
      Object.assign(coupon, couponData);
      coupon.createdAt = new Date();
      coupon.updatedAt = new Date();
      this.coupons.set(coupon.id, coupon);
    });

    this.currentId = Math.max(...coupons.map((c) => c.id)) + 1;
  }

  async findById(id: number): Promise<Coupon | null> {
    return this.coupons.get(id) || null;
  }

  async findByUserId(
    userId: number,
    filter: CouponFilter,
  ): Promise<CouponListResult> {
    let coupons = Array.from(this.coupons.values()).filter(
      (c) => c.userId === userId,
    );

    if (filter.status) {
      coupons = coupons.filter((c) => c.status === filter.status);
    }

    const total = coupons.length;
    const page = filter.page || 1;
    const size = filter.size || 20;
    const totalPages = Math.ceil(total / size);

    coupons.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());

    const start = (page - 1) * size;
    const items = coupons.slice(start, start + size);

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

  async findByUserIdAndStatus(
    userId: number,
    status: CouponStatus,
  ): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).filter(
      (c) => c.userId === userId && c.status === status,
    );
  }

  async findByCouponCode(couponCode: string): Promise<Coupon | null> {
    for (const coupon of this.coupons.values()) {
      if (coupon.couponCode === couponCode) {
        return coupon;
      }
    }
    return null;
  }

  async save(coupon: Coupon): Promise<Coupon> {
    coupon.updatedAt = new Date();
    this.coupons.set(coupon.id, coupon);
    return coupon;
  }

  async create(couponData: Partial<Coupon>): Promise<Coupon> {
    const coupon = new Coupon();
    Object.assign(coupon, couponData);
    coupon.id = this.currentId++;
    coupon.createdAt = new Date();
    coupon.updatedAt = new Date();
    this.coupons.set(coupon.id, coupon);
    return coupon;
  }

  async updateStatus(id: number, status: CouponStatus): Promise<Coupon> {
    const coupon = await this.findById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    coupon.status = status;
    return this.save(coupon);
  }

  async markAsUsed(id: number, usedAt: Date): Promise<Coupon> {
    const coupon = await this.findById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    coupon.status = CouponStatus.USED;
    coupon.usedAt = usedAt;
    return this.save(coupon);
  }

  async findExpiredCoupons(): Promise<Coupon[]> {
    const now = new Date();
    return Array.from(this.coupons.values()).filter(
      (c) => c.expiredAt < now && c.status === CouponStatus.AVAILABLE,
    );
  }

  async bulkUpdateStatus(ids: number[], status: CouponStatus): Promise<void> {
    ids.forEach((id) => {
      const coupon = this.coupons.get(id);
      if (coupon) {
        coupon.status = status;
        coupon.updatedAt = new Date();
      }
    });
  }
}

@Injectable()
export class MemoryCouponEventRepository extends CouponEventRepository {
  private couponEvents: Map<number, CouponEvent> = new Map();
  private currentId = 501;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = [
      {
        id: 501,
        name: '10% 할인 쿠폰',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        totalQuantity: 100,
        issuedQuantity: 2,
        minimumOrderAmount: 50000,
        startDate,
        endDate,
        status: CouponEventStatus.ACTIVE,
      },
      {
        id: 502,
        name: '신규 가입 쿠폰 - 소진됨',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 5000,
        totalQuantity: 50,
        issuedQuantity: 50,
        minimumOrderAmount: 30000,
        startDate,
        endDate,
        status: CouponEventStatus.ACTIVE,
      },
      {
        id: 503,
        name: '특별 할인 쿠폰',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        totalQuantity: 200,
        issuedQuantity: 0,
        minimumOrderAmount: 100000,
        startDate,
        endDate,
        status: CouponEventStatus.ACTIVE,
      },
    ];

    events.forEach((eventData) => {
      const event = new CouponEvent();
      Object.assign(event, eventData);
      event.createdAt = new Date();
      event.updatedAt = new Date();
      event.version = 0;
      this.couponEvents.set(event.id, event);
    });

    this.currentId = Math.max(...events.map((e) => e.id)) + 1;
  }

  async findById(id: number): Promise<CouponEvent | null> {
    return this.couponEvents.get(id) || null;
  }

  async findByStatus(status: CouponEventStatus): Promise<CouponEvent[]> {
    return Array.from(this.couponEvents.values()).filter(
      (e) => e.status === status,
    );
  }

  async findActiveEvents(): Promise<CouponEvent[]> {
    const now = new Date();
    return Array.from(this.couponEvents.values()).filter(
      (e) =>
        e.status === CouponEventStatus.ACTIVE &&
        e.startDate <= now &&
        e.endDate >= now,
    );
  }

  async save(couponEvent: CouponEvent): Promise<CouponEvent> {
    couponEvent.updatedAt = new Date();
    this.couponEvents.set(couponEvent.id, couponEvent);
    return couponEvent;
  }

  async create(couponEventData: Partial<CouponEvent>): Promise<CouponEvent> {
    const couponEvent = new CouponEvent();
    Object.assign(couponEvent, couponEventData);
    couponEvent.id = this.currentId++;
    couponEvent.createdAt = new Date();
    couponEvent.updatedAt = new Date();
    couponEvent.version = 0;
    this.couponEvents.set(couponEvent.id, couponEvent);
    return couponEvent;
  }

  async updateIssuedQuantity(
    id: number,
    quantity: number,
  ): Promise<CouponEvent> {
    const event = await this.findById(id);
    if (!event) {
      throw new Error('CouponEvent not found');
    }
    event.issuedQuantity = quantity;
    return this.save(event);
  }

  async increaseIssuedQuantity(id: number): Promise<CouponEvent> {
    const event = await this.findById(id);
    if (!event) {
      throw new Error('CouponEvent not found');
    }
    event.issuedQuantity += 1;
    return this.save(event);
  }

  async findAvailableForIssue(
    couponEventId: number,
  ): Promise<CouponEvent | null> {
    const event = await this.findById(couponEventId);
    if (!event) {
      return null;
    }

    const now = new Date();
    if (
      event.status !== CouponEventStatus.ACTIVE ||
      event.startDate > now ||
      event.endDate < now ||
      event.issuedQuantity >= event.totalQuantity
    ) {
      return null;
    }

    return event;
  }

  async issueCoupon(data: IssueCouponData): Promise<Coupon> {
    const event = await this.findAvailableForIssue(data.couponEventId);
    if (!event) {
      throw new Error('Coupon event not available for issue');
    }

    // Generate unique coupon code
    const couponCode = `${event.name.substring(0, 5).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const coupon = new Coupon();
    coupon.id = this.currentId++;
    coupon.userId = data.userId;
    coupon.couponEventId = data.couponEventId;
    coupon.couponCode = couponCode;
    coupon.status = CouponStatus.AVAILABLE;
    coupon.issuedAt = new Date();
    coupon.usedAt = null;
    coupon.expiredAt = event.endDate;
    coupon.createdAt = new Date();
    coupon.updatedAt = new Date();

    // Store the coupon
    this.coupons.set(coupon.id, coupon);

    // Update event issued quantity
    await this.increaseIssuedQuantity(data.couponEventId);

    return coupon;
  }
}
