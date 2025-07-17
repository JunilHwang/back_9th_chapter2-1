import { Product, ProductStatus, SalesStatistics } from '../entities';

export interface ProductFilter {
  status?: ProductStatus;
  page?: number;
  size?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export abstract class ProductRepository {
  abstract findById(id: number): Promise<Product | null>;

  abstract findByIds(ids: number[]): Promise<Product[]>;

  abstract findAll(filter: ProductFilter): Promise<ProductListResult>;

  abstract save(product: Product): Promise<Product>;

  abstract create(productData: Partial<Product>): Promise<Product>;

  abstract updateStock(id: number, quantity: number): Promise<Product>;

  abstract decreaseStock(id: number, quantity: number): Promise<Product>;

  abstract findByStatus(status: ProductStatus): Promise<Product[]>;

  abstract delete(id: number): Promise<void>;
}

export interface PopularProductFilter {
  days?: number;
  top?: number;
}

export interface PopularProductResult {
  rank: number;
  productId: number;
  productName: string;
  price: number;
  salesQuantity: number;
  salesAmount: number;
  stockQuantity: number;
  status: string;
}

export interface PopularProductsResult {
  period: {
    fromDate: number;
    toDate: number;
    days: number;
  };
  items: PopularProductResult[];
  summary: {
    totalProducts: number;
    totalSalesCount: number;
    totalSalesAmount: number;
  };
}

export abstract class SalesStatisticsRepository {
  abstract findByProductId(productId: number): Promise<SalesStatistics[]>;

  abstract findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SalesStatistics[]>;

  abstract save(statistics: SalesStatistics): Promise<SalesStatistics>;

  abstract create(
    statisticsData: Partial<SalesStatistics>,
  ): Promise<SalesStatistics>;

  abstract findPopularProducts(
    filter: PopularProductFilter,
  ): Promise<PopularProductsResult>;

  abstract bulkSave(statistics: SalesStatistics[]): Promise<SalesStatistics[]>;
}
