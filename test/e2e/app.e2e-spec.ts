import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E 테스트', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('잔액 관리 API', () => {
    describe('POST /api/v1/balances/charge', () => {
      it('잔액 충전이 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/balances/charge')
          .send({
            userId: 1,
            amount: 50000,
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            userId: 1,
            chargedAmount: 50000,
            currentBalance: expect.any(Number),
            chargedAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });
      });

      it('잘못된 금액으로 충전 시 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/balances/charge')
          .send({
            userId: 1,
            amount: 0,
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: expect.any(String),
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });

      it('존재하지 않는 사용자로 충전 시 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/balances/charge')
          .send({
            userId: 999,
            amount: 50000,
          })
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('GET /api/v1/balances/:userId', () => {
      it('사용자 잔액 조회가 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/balances/1')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            userId: 1,
            currentBalance: expect.any(Number),
            dailyChargedAmount: expect.any(Number),
            lastUpdatedAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });
      });

      it('존재하지 않는 사용자 잔액 조회 시 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/balances/999')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe('상품 관리 API', () => {
    describe('GET /api/v1/products', () => {
      it('페이지네이션이 적용된 상품 목록 조회가 성공해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products')
          .query({
            page: 1,
            size: 20,
            status: 'ACTIVE',
            sortBy: 'price',
            sortOrder: 'ASC',
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            items: expect.any(Array),
            pagination: {
              page: 1,
              size: 20,
              total: expect.any(Number),
              totalPages: expect.any(Number),
              hasNext: expect.any(Boolean),
              hasPrevious: expect.any(Boolean),
            },
          },
          timestamp: expect.any(Number),
        });

        if (response.body.data.items.length > 0) {
          expect(response.body.data.items[0]).toEqual({
            id: expect.any(Number),
            name: expect.any(String),
            price: expect.any(Number),
            stockQuantity: expect.any(Number),
            status: expect.any(String),
            createdAt: expect.any(Number),
          });
        }
      });

      it('기본 파라미터로 상품 목록 조회가 성공해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            items: expect.any(Array),
            pagination: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('GET /api/v1/products/:productId', () => {
      it('상품 상세 정보 조회가 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/101')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            id: 101,
            name: expect.any(String),
            price: expect.any(Number),
            stockQuantity: expect.any(Number),
            status: expect.any(String),
            description: expect.any(String),
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });
      });

      it('존재하지 않는 상품 조회 시 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/999')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe('주문 관리 API', () => {
    describe('POST /api/v1/orders', () => {
      it('주문 생성이 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/orders')
          .send({
            userId: 1,
            items: [
              {
                productId: 101,
                quantity: 2,
              },
              {
                productId: 102,
                quantity: 1,
              },
            ],
          })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: {
            orderId: expect.any(Number),
            status: 'PENDING',
            totalAmount: expect.any(Number),
            discountAmount: expect.any(Number),
            finalAmount: expect.any(Number),
            items: expect.any(Array),
            createdAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });

        expect(response.body.data.items[0]).toEqual({
          productId: expect.any(Number),
          productName: expect.any(String),
          unitPrice: expect.any(Number),
          quantity: expect.any(Number),
          totalPrice: expect.any(Number),
        });
      });

      it('쿠폰이 적용된 주문 생성이 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/orders')
          .send({
            userId: 1,
            items: [
              {
                productId: 101,
                quantity: 2,
              },
            ],
            couponId: 3001,
          })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: {
            orderId: expect.any(Number),
            status: 'PENDING',
            totalAmount: expect.any(Number),
            discountAmount: expect.any(Number),
            finalAmount: expect.any(Number),
            items: expect.any(Array),
            coupon: {
              couponId: 3001,
              couponCode: expect.any(String),
              discountType: expect.any(String),
              discountValue: expect.any(Number),
              discountAmount: expect.any(Number),
            },
            createdAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });
      });

      it('재고 부족 상품으로 주문 생성 시 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/orders')
          .send({
            userId: 1,
            items: [
              {
                productId: 101,
                quantity: 1000,
              },
            ],
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('POST /api/v1/orders/:orderId/payment', () => {
      let orderId: number;

      beforeEach(async () => {
        // Create order first
        const orderResponse = await request(app.getHttpServer())
          .post('/api/v1/orders')
          .send({
            userId: 1,
            items: [
              {
                productId: 101,
                quantity: 1,
              },
            ],
          });
        orderId = orderResponse.body.data.orderId;

        // Charge balance
        await request(app.getHttpServer())
          .post('/api/v1/balances/charge')
          .send({
            userId: 1,
            amount: 100000,
          });
      });

      it('결제 처리가 성공적으로 완료되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/orders/${orderId}/payment`)
          .send({
            userId: 1,
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            paymentId: expect.any(Number),
            orderId: orderId,
            status: 'SUCCESS',
            amount: expect.any(Number),
            balanceBefore: expect.any(Number),
            balanceAfter: expect.any(Number),
            paidAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });
      });

      it('잔액 부족 시 결제가 실패해야 한다', async () => {
        // Create expensive order
        const expensiveOrderResponse = await request(app.getHttpServer())
          .post('/api/v1/orders')
          .send({
            userId: 1,
            items: [
              {
                productId: 101,
                quantity: 100,
              },
            ],
          });

        const response = await request(app.getHttpServer())
          .post(
            `/api/v1/orders/${expensiveOrderResponse.body.data.orderId}/payment`,
          )
          .send({
            userId: 1,
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('GET /api/v1/orders/:orderId', () => {
      it('주문 상세 정보 조회가 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/orders/1001')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            orderId: 1001,
            userId: expect.any(Number),
            status: expect.any(String),
            totalAmount: expect.any(Number),
            discountAmount: expect.any(Number),
            finalAmount: expect.any(Number),
            items: expect.any(Array),
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });
      });

      it('존재하지 않는 주문 조회 시 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/orders/999')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('GET /api/v1/users/:userId/orders', () => {
      it('사용자 주문 목록 조회가 페이지네이션과 함께 성공해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/1/orders')
          .query({
            page: 1,
            size: 20,
            status: 'PENDING',
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            items: expect.any(Array),
            pagination: {
              page: 1,
              size: 20,
              total: expect.any(Number),
              totalPages: expect.any(Number),
              hasNext: expect.any(Boolean),
              hasPrevious: expect.any(Boolean),
            },
          },
          timestamp: expect.any(Number),
        });

        if (response.body.data.items.length > 0) {
          expect(response.body.data.items[0]).toEqual({
            orderId: expect.any(Number),
            status: expect.any(String),
            totalAmount: expect.any(Number),
            discountAmount: expect.any(Number),
            finalAmount: expect.any(Number),
            itemCount: expect.any(Number),
            createdAt: expect.any(Number),
          });
        }
      });
    });
  });

  describe('쿠폰 관리 API', () => {
    describe('POST /api/v1/coupons/issue', () => {
      it('쿠폰 발급이 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/coupons/issue')
          .send({
            userId: 1,
            couponEventId: 501,
          })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: {
            couponId: expect.any(Number),
            couponCode: expect.any(String),
            discountType: expect.any(String),
            discountValue: expect.any(Number),
            minimumOrderAmount: expect.any(Number),
            status: 'AVAILABLE',
            issuedAt: expect.any(Number),
            expiredAt: expect.any(Number),
          },
          timestamp: expect.any(Number),
        });
      });

      it('쿠폰이 소진되었을 때 발급이 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/coupons/issue')
          .send({
            userId: 1,
            couponEventId: 502,
          })
          .expect(409);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'COUPON_EXHAUSTED',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('GET /api/v1/coupons', () => {
      it('사용자 쿠폰 목록 조회가 페이지네이션과 함께 성공해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/coupons')
          .query({
            userId: 1,
            status: 'AVAILABLE',
            page: 1,
            size: 10,
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            items: expect.any(Array),
            pagination: {
              page: 1,
              size: 10,
              total: expect.any(Number),
              totalPages: expect.any(Number),
              hasNext: expect.any(Boolean),
              hasPrevious: expect.any(Boolean),
            },
          },
          timestamp: expect.any(Number),
        });

        if (response.body.data.items.length > 0) {
          expect(response.body.data.items[0]).toEqual({
            couponId: expect.any(Number),
            couponCode: expect.any(String),
            discountType: expect.any(String),
            discountValue: expect.any(Number),
            minimumOrderAmount: expect.any(Number),
            status: expect.any(String),
            issuedAt: expect.any(Number),
            expiredAt: expect.any(Number),
          });
        }
      });
    });
  });

  describe('인기 상품 API', () => {
    describe('GET /api/v1/products/popular', () => {
      it('인기 상품 조회가 성공적으로 처리되어야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/popular')
          .query({
            days: 7,
            top: 10,
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            period: {
              fromDate: expect.any(Number),
              toDate: expect.any(Number),
              days: 7,
            },
            items: expect.any(Array),
            summary: {
              totalProducts: expect.any(Number),
              totalSalesCount: expect.any(Number),
              totalSalesAmount: expect.any(Number),
            },
          },
          timestamp: expect.any(Number),
        });

        if (response.body.data.items.length > 0) {
          expect(response.body.data.items[0]).toEqual({
            rank: expect.any(Number),
            productId: expect.any(Number),
            productName: expect.any(String),
            price: expect.any(Number),
            salesQuantity: expect.any(Number),
            salesAmount: expect.any(Number),
            stockQuantity: expect.any(Number),
            status: expect.any(String),
          });
        }
      });

      it('기본 파라미터로 인기 상품 조회가 성공해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/popular')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            period: {
              fromDate: expect.any(Number),
              toDate: expect.any(Number),
              days: 3,
            },
            items: expect.any(Array),
            summary: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });

      it('잘못된 파라미터로 인기 상품 조회 시 실패해야 한다', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/popular')
          .query({
            days: 35,
            top: 5,
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.any(Number),
        });
      });
    });
  });
});
