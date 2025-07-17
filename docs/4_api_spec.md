# REST API 명세서

## 공통 정보

### Base URL
```
http://localhost:3000/api/v1
```

### 공통 헤더
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token} (필요시)
```

### 공통 응답 형식
```typescript
// 성공 응답
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: number;
}

// 에러 응답
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}
```

### 에러 코드 정의
```typescript
enum ErrorCode {
  // 잔액 관련
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DAILY_CHARGE_LIMIT_EXCEEDED = 'DAILY_CHARGE_LIMIT_EXCEEDED',
  MAX_BALANCE_LIMIT_EXCEEDED = 'MAX_BALANCE_LIMIT_EXCEEDED',
  
  // 상품 관련
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PRODUCT_INACTIVE = 'PRODUCT_INACTIVE',
  
  // 주문 관련
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID = 'ORDER_ALREADY_PAID',
  ORDER_AMOUNT_MISMATCH = 'ORDER_AMOUNT_MISMATCH',
  
  // 쿠폰 관련
  COUPON_NOT_FOUND = 'COUPON_NOT_FOUND',
  COUPON_EXHAUSTED = 'COUPON_EXHAUSTED',
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  COUPON_ALREADY_USED = 'COUPON_ALREADY_USED',
  MINIMUM_ORDER_AMOUNT_NOT_MET = 'MINIMUM_ORDER_AMOUNT_NOT_MET',
  
  // 공통
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}
```

---

## 1. 잔액 충전 / 조회 API

### 1.1 잔액 충전
- **POST** `/balances/charge`
- **설명**: 사용자 잔액을 지정 금액만큼 충전

#### Request
```typescript
interface ChargeBalanceRequest {
  userId: number;
  amount: number; // 충전 금액 (원 단위, 1 이상)
}
```

#### Response
```typescript
interface ChargeBalanceResponse {
  userId: number;
  chargedAmount: number;
  currentBalance: number;
  chargedAt: number; // timestamp (milliseconds)
}
```

#### 예시
**Request Body**
```json
{
  "userId": 1,
  "amount": 50000
}
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "chargedAmount": 50000,
    "currentBalance": 100000,
    "chargedAt": 1721211600000
  },
  "timestamp": 1721211600000
}
```

**Error Response (400)**
```json
{
  "success": false,
  "error": {
    "code": "DAILY_CHARGE_LIMIT_EXCEEDED",
    "message": "일일 충전 한도를 초과했습니다.",
    "details": {
      "dailyLimit": 1000000,
      "currentDailyCharged": 950000,
      "attemptedAmount": 100000
    }
  },
  "timestamp": 1721211600000
}
```

**Status Codes**
- `200`: 충전 성공
- `400`: 잘못된 요청 (금액 0 이하, 한도 초과)
- `404`: 사용자 없음
- `500`: 서버 오류

### 1.2 잔액 조회
- **GET** `/balances/{userId}`
- **설명**: 사용자의 현재 잔액 및 마지막 업데이트 일시 조회

#### Path Parameters
```typescript
interface GetBalanceParams {
  userId: number;
}
```

#### Response
```typescript
interface GetBalanceResponse {
  userId: number;
  currentBalance: number;
  dailyChargedAmount: number;
  lastUpdatedAt: number; // timestamp (milliseconds)
}
```

#### 예시
**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "currentBalance": 100000,
    "dailyChargedAmount": 50000,
    "lastUpdatedAt": 1721211600000
  },
  "timestamp": 1721211600000
}
```

**Error Response (404)**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다.",
    "details": {
      "userId": 999
    }
  },
  "timestamp": 1721211600000
}
```

---

## 2. 상품 조회 API

### 2.1 상품 목록 조회
- **GET** `/products`
- **설명**: 상품 목록을 페이징하여 조회

#### Query Parameters
```typescript
interface GetProductsQuery {
  page?: number; // 페이지 번호 (기본값: 1, 최소값: 1)
  size?: number; // 페이지 크기 (기본값: 20, 최대값: 100)
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'; // 상품 상태 필터
  sortBy?: 'name' | 'price' | 'createdAt'; // 정렬 기준 (기본값: createdAt)
  sortOrder?: 'ASC' | 'DESC'; // 정렬 순서 (기본값: DESC)
}
```

#### Response
```typescript
interface GetProductsResponse {
  items: ProductSummary[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface ProductSummary {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  createdAt: number; // timestamp
}
```

#### 예시
**Request URL**
```
GET /products?page=1&size=20&status=ACTIVE&sortBy=price&sortOrder=ASC
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "name": "무선 마우스",
        "price": 25000,
        "stockQuantity": 50,
        "status": "ACTIVE",
        "createdAt": 1721211600000
      },
      {
        "id": 102,
        "name": "블루투스 키보드",
        "price": 45000,
        "stockQuantity": 30,
        "status": "ACTIVE",
        "createdAt": 1721211300000
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false
    }
  },
  "timestamp": 1721211600000
}
```

### 2.2 상품 상세 조회
- **GET** `/products/{productId}`
- **설명**: 단일 상품의 상세 정보 조회

#### Path Parameters
```typescript
interface GetProductParams {
  productId: number;
}
```

#### Response
```typescript
interface GetProductResponse {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  description: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}
```

#### 예시
**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "name": "무선 마우스",
    "price": 25000,
    "stockQuantity": 50,
    "status": "ACTIVE",
    "description": "고성능 무선 게이밍 마우스",
    "createdAt": 1721211600000,
    "updatedAt": 1721211600000
  },
  "timestamp": 1721211600000
}
```

---

## 3. 주문 / 결제 API

### 3.1 주문 생성
- **POST** `/orders`
- **설명**: 주문 생성 (상품/수량, 쿠폰ID 선택)

#### Request
```typescript
interface CreateOrderRequest {
  userId: number;
  items: OrderItem[];
  couponId?: number; // 선택적 쿠폰 적용
}

interface OrderItem {
  productId: number;
  quantity: number; // 1 이상
}
```

#### Response
```typescript
interface CreateOrderResponse {
  orderId: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  totalAmount: number; // 상품 총 금액
  discountAmount: number; // 할인 금액
  finalAmount: number; // 최종 결제 금액
  items: OrderItemDetail[];
  coupon?: AppliedCoupon;
  createdAt: number; // timestamp
}

interface OrderItemDetail {
  productId: number;
  productName: string;
  unitPrice: number; // 주문 시점 단가
  quantity: number;
  totalPrice: number; // unitPrice * quantity
}

interface AppliedCoupon {
  couponId: number;
  couponCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountAmount: number; // 실제 할인된 금액
}
```

#### 예시
**Request Body**
```json
{
  "userId": 1,
  "items": [
    {
      "productId": 101,
      "quantity": 2
    },
    {
      "productId": 102,
      "quantity": 1
    }
  ],
  "couponId": 3001
}
```

**Success Response (201)**
```json
{
  "success": true,
  "data": {
    "orderId": 1001,
    "status": "PENDING",
    "totalAmount": 95000,
    "discountAmount": 9500,
    "finalAmount": 85500,
    "items": [
      {
        "productId": 101,
        "productName": "무선 마우스",
        "unitPrice": 25000,
        "quantity": 2,
        "totalPrice": 50000
      },
      {
        "productId": 102,
        "productName": "블루투스 키보드",
        "unitPrice": 45000,
        "quantity": 1,
        "totalPrice": 45000
      }
    ],
    "coupon": {
      "couponId": 3001,
      "couponCode": "SALE10",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "discountAmount": 9500
    },
    "createdAt": 1721211600000
  },
  "timestamp": 1721211600000
}
```

**Error Response (400)**
```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "재고가 부족합니다.",
    "details": {
      "productId": 101,
      "requestedQuantity": 100,
      "availableStock": 50
    }
  },
  "timestamp": 1721211600000
}
```

### 3.2 결제 처리
- **POST** `/orders/{orderId}/payment`
- **설명**: 주문 결제 및 잔액 차감

#### Path Parameters
```typescript
interface PaymentParams {
  orderId: number;
}
```

#### Request
```typescript
interface ProcessPaymentRequest {
  userId: number;
}
```

#### Response
```typescript
interface ProcessPaymentResponse {
  paymentId: number;
  orderId: number;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  failureReason?: string;
  paidAt: number; // timestamp
}
```

#### 예시
**Request Body**
```json
{
  "userId": 1
}
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "paymentId": 2001,
    "orderId": 1001,
    "status": "SUCCESS",
    "amount": 85500,
    "balanceBefore": 100000,
    "balanceAfter": 14500,
    "paidAt": 1721211650000
  },
  "timestamp": 1721211650000
}
```

**Error Response (400)**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "잔액이 부족합니다.",
    "details": {
      "currentBalance": 50000,
      "requiredAmount": 85500,
      "shortfall": 35500
    }
  },
  "timestamp": 1721211650000
}
```

---

## 4. 선착순 쿠폰 API

### 4.1 쿠폰 발급
- **POST** `/coupons/issue`
- **설명**: 쿠폰 이벤트 ID로 선착순 쿠폰 발급

#### Request
```typescript
interface IssueCouponRequest {
  userId: number;
  couponEventId: number;
}
```

#### Response
```typescript
interface IssueCouponResponse {
  couponId: number;
  couponCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount: number;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  issuedAt: number; // timestamp
  expiredAt: number; // timestamp
}
```

#### 예시
**Request Body**
```json
{
  "userId": 1,
  "couponEventId": 501
}
```

**Success Response (201)**
```json
{
  "success": true,
  "data": {
    "couponId": 3001,
    "couponCode": "SALE10-ABC123",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "minimumOrderAmount": 50000,
    "status": "AVAILABLE",
    "issuedAt": 1721211600000,
    "expiredAt": 1721898000000
  },
  "timestamp": 1721211600000
}
```

**Error Response (409)**
```json
{
  "success": false,
  "error": {
    "code": "COUPON_EXHAUSTED",
    "message": "선착순 쿠폰이 모두 소진되었습니다.",
    "details": {
      "couponEventId": 501,
      "totalQuantity": 100,
      "issuedQuantity": 100
    }
  },
  "timestamp": 1721211600000
}
```

### 4.2 보유 쿠폰 목록 조회
- **GET** `/coupons`
- **설명**: 사용자의 보유 쿠폰 목록 조회

#### Query Parameters
```typescript
interface GetCouponsQuery {
  userId: number;
  status?: 'AVAILABLE' | 'USED' | 'EXPIRED'; // 쿠폰 상태 필터
  page?: number; // 기본값: 1
  size?: number; // 기본값: 20
}
```

#### Response
```typescript
interface GetCouponsResponse {
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

interface CouponSummary {
  couponId: number;
  couponCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount: number;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  issuedAt: number; // timestamp
  usedAt?: number; // timestamp (사용된 경우)
  expiredAt: number; // timestamp
}
```

#### 예시
**Request URL**
```
GET /coupons?userId=1&status=AVAILABLE&page=1&size=10
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "couponId": 3001,
        "couponCode": "SALE10-ABC123",
        "discountType": "PERCENTAGE",
        "discountValue": 10,
        "minimumOrderAmount": 50000,
        "status": "AVAILABLE",
        "issuedAt": 1721211600000,
        "expiredAt": 1721898000000
      }
    ],
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  },
  "timestamp": 1721211600000
}
```

---

## 5. 인기 판매 상품 조회 API

### 5.1 인기 상품 조회
- **GET** `/products/popular`
- **설명**: 최근 N일간 판매량 기준 상위 K개 상품 조회

#### Query Parameters
```typescript
interface GetPopularProductsQuery {
  days?: number; // 조회 일수 (기본값: 3, 범위: 1-30)
  top?: number; // 상위 상품 개수 (기본값: 5, 범위: 1-50)
}
```

#### Response
```typescript
interface GetPopularProductsResponse {
  period: {
    fromDate: number; // timestamp - 조회 시작일
    toDate: number; // timestamp - 조회 종료일
    days: number; // 조회 일수
  };
  items: PopularProduct[];
  summary: {
    totalProducts: number; // 전체 상품 수
    totalSalesCount: number; // 전체 판매 건수
    totalSalesAmount: number; // 전체 매출액
  };
}

interface PopularProduct {
  rank: number; // 순위 (1부터 시작)
  productId: number;
  productName: string;
  price: number; // 현재 가격
  salesQuantity: number; // 판매 수량
  salesAmount: number; // 매출액
  stockQuantity: number; // 현재 재고
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}
```

#### 예시
**Request URL**
```
GET /products/popular?days=7&top=10
```

**Success Response (200)**
```json
{
  "success": true,
  "data": {
    "period": {
      "fromDate": 1720606800000,
      "toDate": 1721211600000,
      "days": 7
    },
    "items": [
      {
        "rank": 1,
        "productId": 101,
        "productName": "게이밍 마우스",
        "price": 65000,
        "salesQuantity": 150,
        "salesAmount": 9750000,
        "stockQuantity": 25,
        "status": "ACTIVE"
      },
      {
        "rank": 2,
        "productId": 102,
        "productName": "무선 키보드",
        "price": 45000,
        "salesQuantity": 120,
        "salesAmount": 5400000,
        "stockQuantity": 40,
        "status": "ACTIVE"
      }
    ],
    "summary": {
      "totalProducts": 250,
      "totalSalesCount": 1850,
      "totalSalesAmount": 45750000
    }
  },
  "timestamp": 1721211600000
}
```

**Error Response (400)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "잘못된 파라미터입니다.",
    "details": {
      "field": "days",
      "value": 35,
      "allowedRange": "1-30"
    }
  },
  "timestamp": 1721211600000
}
```

---

## 6. 기타 유틸리티 API

### 6.1 주문 조회
- **GET** `/orders/{orderId}`
- **설명**: 특정 주문의 상세 정보 조회

#### Path Parameters
```typescript
interface GetOrderParams {
  orderId: number;
}
```

#### Response
```typescript
interface GetOrderResponse {
  orderId: number;
  userId: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  items: OrderItemDetail[];
  coupon?: AppliedCoupon;
  payment?: {
    paymentId: number;
    status: 'SUCCESS' | 'FAILED';
    paidAt?: number; // timestamp
    failureReason?: string;
  };
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}
```

### 6.2 사용자 주문 목록 조회
- **GET** `/users/{userId}/orders`
- **설명**: 사용자의 주문 목록을 페이징하여 조회

#### Path Parameters & Query Parameters
```typescript
interface GetUserOrdersParams {
  userId: number;
}

interface GetUserOrdersQuery {
  page?: number; // 기본값: 1
  size?: number; // 기본값: 20
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'; // 주문 상태 필터
  sortBy?: 'createdAt' | 'finalAmount'; // 정렬 기준 (기본값: createdAt)
  sortOrder?: 'ASC' | 'DESC'; // 정렬 순서 (기본값: DESC)
}
```

#### Response
```typescript
interface GetUserOrdersResponse {
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

interface OrderSummary {
  orderId: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  itemCount: number; // 주문 상품 종류 수
  createdAt: number; // timestamp
}
```

---

> **참고사항**
> - 모든 timestamp는 밀리초 단위의 Unix timestamp입니다.
> - 페이징은 1부터 시작하며, 기본 페이지 크기는 20개입니다.
> - 모든 금액은 원(KRW) 단위로 처리됩니다.
