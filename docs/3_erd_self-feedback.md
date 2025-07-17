## 충족 완료된 요구사항

### 1. 잔액 충전/조회 기능
- [x] **BALANCE 테이블**: `current_balance`, `daily_charge_amount`로 잔액 관리
- [x] **BALANCE_TRANSACTION 테이블**: 거래 이력 추적 (`CHARGE`, `USE`, `REFUND`)
- [x] **일일 한도 체크**: `daily_charge_amount` 컬럼으로 일일 충전 한도 관리 가능
- [x] **최대 보유 한도**: 애플리케이션 레벨에서 `current_balance` 체크 가능

### 2. 상품 조회 기능
- [x] **PRODUCT 테이블**: 상품 정보, 가격, 재고 관리
- [x] **상품 상태 관리**: `ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`
- [x] **재고 관리**: `stock_quantity` 컬럼
- [x] **페이징 지원**: 기본 구조로 페이징 구현 가능

### 3. 주문/결제 기능
- [x] **ORDER 테이블**: 주문 정보, 상태 관리 (`PENDING`, `COMPLETED`, `FAILED`)
- [x] **ORDER_PRODUCT 테이블**: 주문-상품 다대다 관계 해결
- [x] **PAYMENT 테이블**: 결제 정보 및 상태 관리
- [x] **주문 시점 정보 보존**: `unit_price`, `total_price`로 주문 시점 가격 저장

### 4. 선착순 쿠폰 기능
- [x] **COUPON_EVENT 테이블**: 쿠폰 이벤트 관리
- [x] **COUPON 테이블**: 발급된 쿠폰 관리
- [x] **선착순 관리**: `total_quantity`, `issued_quantity`로 발급 수량 제한
- [x] **할인 타입 지원**: `PERCENTAGE`, `FIXED_AMOUNT`
- [x] **최소 주문 금액**: `minimum_order_amount`

### 5. 인기 상품 조회 기능
- [x] **SALES_STATISTICS 테이블**: 판매 통계 전용 테이블
- [x] **순위 관리**: `rank_position` 컬럼
- [x] **기간별 통계**: `statistics_date`로 일별 통계 관리
- [x] **판매량/매출액**: `sales_quantity`, `sales_amount`

### 6. 동시성 처리
- [x] **낙관적 락**: `version` 컬럼 적용
- [x] **적용 테이블**: `PRODUCT`, `ORDER`, `COUPON_EVENT`
- [x] **동시성 제어**: 재고, 잔액, 쿠폰 발급 시 충돌 방지

### 7. 데이터 전송 기능
- [x] **DATA_TRANSFER 테이블**: 외부 플랫폼 전송 관리
- [x] **재시도 로직**: `retry_count`, `error_message`
- [x] **전송 상태 추적**: `PENDING`, `SUCCESS`, `FAILED`
- [x] **전송 타입 구분**: `ORDER_COMPLETE`, `PAYMENT_COMPLETE`

## ⚠️ 개선이 필요한 부분

### 1. BALANCE 테이블 동시성 제어
```sql
-- 현재 설계
BALANCE {
    -- version 컬럼 없음 ❌
}

-- 개선 제안
BALANCE {
    int version  -- 잔액 차감 시 동시성 제어 필요
}
```

**이유**: 요구사항에서 "잔액 락 정책" 명시. 동시 결제 시 잔액 차감 충돌 방지 필요.

### 2. 쿠폰 사용 관계 설정
```sql
-- 현재 설계
ORDER {
    bigint coupon_id FK "nullable"  -- 단순 FK 관계
}

-- 개선 제안
ORDER {
    bigint coupon_id FK "nullable"
}
-- 추가로 COUPON 테이블에 order_id 추가하여 양방향 관계 설정
```

**이유**: 쿠폰이 어떤 주문에 사용되었는지 추적 필요. 현재는 단방향 관계만 존재.

### 3. 잔액 한도 관리 강화
```sql
-- 현재 설계
BALANCE {
    int daily_charge_amount  -- 일일 충전 금액만
}

-- 개선 제안
BALANCE {
    int daily_charge_amount
    date last_charge_date       -- 일일 한도 초기화 날짜
    int max_balance_limit   -- 최대 보유 한도 (설정 가능)
}
```

**이유**: 요구사항에서 "일일 한도 1,000,000원, 최대 보유 한도 10,000,000원" 명시.

---

## 성능 최적화 확인

### 인덱스 설계 (잘 고려됨)
- [x] 사용자별 주문 조회: `(user_id, created_at)`
- [x] 통계 조회: `(statistics_date, rank_position)`
- [x] 쿠폰 발급: `(status, start_date, end_date)`

### 읽기/쓰기 분리 (잘 고려됨)
- [x] 운영 데이터: `ORDER`, `ORDER_PRODUCT`
- [x] 통계 데이터: `SALES_STATISTICS`

### ⚠️ 추가 인덱스가 필요할 수 있음
```sql
-- 잔액 조회 최적화
CREATE INDEX idx_user_balance ON balance(user_id, current_balance);

-- 쿠폰 조회 최적화
CREATE INDEX idx_user_coupon_status ON coupon(user_id, status, expired_at);

-- 결제 이력 조회 최적화
CREATE INDEX idx_payment_created ON payment(created_at);
```

---

## 비즈니스 로직 지원도 평가

### 주문 플로우 지원

사용자 → 잔액 충전 → 상품 조회 → 쿠폰 발급 → 주문 생성 → 결제 처리 → 데이터 전송

### 동시성 시나리오 지원
- [x] 재고 부족 상황
- [x] 잔액 부족 상황
- [x] 쿠폰 소진 상황
- [x] 대용량 트래픽 상황

### 장애 대응 시나리오 지원
- [x] 결제 실패 처리
- [x] 데이터 전송 실패 처리
- [x] 시스템 복구 처리

---

## ⚠️ 종합 개선 포인트

1. **BALANCE 테이블 동시성 제어 추가** (중요도: 높음)
2. **쿠폰-주문 양방향 관계 설정** (중요도: 중간)
3. **잔액 한도 관리 강화** (중요도: 중간)
4. **추가 인덱스 설계** (중요도: 낮음)
