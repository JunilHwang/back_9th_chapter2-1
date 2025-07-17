import { Injectable } from '@nestjs/common';
import {
  PopularProductFilter,
  PopularProductResult,
  PopularProductsResult,
  ProductFilter,
  ProductListResult,
  ProductRepository,
  SalesStatisticsRepository,
} from '../product.repository';
import { Product, ProductStatus, SalesStatistics } from '../../entities';

@Injectable()
export class MemoryProductRepository extends ProductRepository {
  private products: Map<number, Product> = new Map();
  private currentId = 101;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const products = [
      {
        id: 101,
        name: '무선 마우스',
        price: 25000,
        stockQuantity: 50,
        status: ProductStatus.ACTIVE,
        description: '고성능 무선 게이밍 마우스',
      },
      {
        id: 102,
        name: '블루투스 키보드',
        price: 45000,
        stockQuantity: 30,
        status: ProductStatus.ACTIVE,
        description: '무선 블루투스 키보드',
      },
      {
        id: 103,
        name: '모니터',
        price: 150000,
        stockQuantity: 20,
        status: ProductStatus.ACTIVE,
        description: '24인치 FHD 모니터',
      },
      {
        id: 104,
        name: '웹캠',
        price: 80000,
        stockQuantity: 0,
        status: ProductStatus.OUT_OF_STOCK,
        description: '4K 웹캠',
      },
      {
        id: 105,
        name: '스피커',
        price: 35000,
        stockQuantity: 25,
        status: ProductStatus.ACTIVE,
        description: '블루투스 스피커',
      },
      {
        id: 106,
        name: '마우스패드',
        price: 15000,
        stockQuantity: 100,
        status: ProductStatus.ACTIVE,
        description: '게이밍 마우스패드',
      },
      {
        id: 107,
        name: '헤드셋',
        price: 65000,
        stockQuantity: 40,
        status: ProductStatus.ACTIVE,
        description: '게이밍 헤드셋',
      },
      {
        id: 108,
        name: '노트북 스탠드',
        price: 30000,
        stockQuantity: 60,
        status: ProductStatus.ACTIVE,
        description: '알루미늄 노트북 스탠드',
      },
    ];

    products.forEach((productData) => {
      const product = new Product();
      Object.assign(product, productData);
      product.createdAt = new Date();
      product.updatedAt = new Date();
      product.version = 0;
      this.products.set(product.id, product);
    });

    this.currentId = Math.max(...products.map((p) => p.id)) + 1;
  }

  async findById(id: number): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async findByIds(ids: number[]): Promise<Product[]> {
    return ids.map((id) => this.products.get(id)).filter(Boolean) as Product[];
  }

  async findAll(filter: ProductFilter): Promise<ProductListResult> {
    let products = Array.from(this.products.values());

    if (filter.status) {
      products = products.filter((p) => p.status === filter.status);
    }

    const total = products.length;
    const page = filter.page || 1;
    const size = filter.size || 20;
    const totalPages = Math.ceil(total / size);

    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'DESC';

    products.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
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
    const items = products.slice(start, start + size);

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

  async save(product: Product): Promise<Product> {
    product.updatedAt = new Date();
    this.products.set(product.id, product);
    return product;
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = new Product();
    Object.assign(product, productData);
    product.id = this.currentId++;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    product.version = 0;
    this.products.set(product.id, product);
    return product;
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    product.stockQuantity = quantity;
    product.status =
      quantity > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;
    return this.save(product);
  }

  async decreaseStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }
    product.stockQuantity -= quantity;
    product.status =
      product.stockQuantity > 0
        ? ProductStatus.ACTIVE
        : ProductStatus.OUT_OF_STOCK;
    return this.save(product);
  }

  async findByStatus(status: ProductStatus): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (p) => p.status === status,
    );
  }

  async delete(id: number): Promise<void> {
    this.products.delete(id);
  }
}

@Injectable()
export class MemorySalesStatisticsRepository extends SalesStatisticsRepository {
  private statistics: Map<number, SalesStatistics> = new Map();
  private currentId = 1;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    const statistics = [
      // Today
      {
        id: 1,
        productId: 101,
        statisticsDate: today,
        salesQuantity: 15,
        salesAmount: 375000,
        rankPosition: 1,
      },
      {
        id: 2,
        productId: 102,
        statisticsDate: today,
        salesQuantity: 12,
        salesAmount: 540000,
        rankPosition: 2,
      },
      {
        id: 3,
        productId: 103,
        statisticsDate: today,
        salesQuantity: 8,
        salesAmount: 1200000,
        rankPosition: 3,
      },
      {
        id: 4,
        productId: 107,
        statisticsDate: today,
        salesQuantity: 10,
        salesAmount: 650000,
        rankPosition: 4,
      },
      {
        id: 5,
        productId: 105,
        statisticsDate: today,
        salesQuantity: 7,
        salesAmount: 245000,
        rankPosition: 5,
      },

      // Yesterday
      {
        id: 6,
        productId: 101,
        statisticsDate: yesterday,
        salesQuantity: 20,
        salesAmount: 500000,
        rankPosition: 1,
      },
      {
        id: 7,
        productId: 107,
        statisticsDate: yesterday,
        salesQuantity: 15,
        salesAmount: 975000,
        rankPosition: 2,
      },
      {
        id: 8,
        productId: 102,
        statisticsDate: yesterday,
        salesQuantity: 10,
        salesAmount: 450000,
        rankPosition: 3,
      },
      {
        id: 9,
        productId: 103,
        statisticsDate: yesterday,
        salesQuantity: 5,
        salesAmount: 750000,
        rankPosition: 4,
      },
      {
        id: 10,
        productId: 105,
        statisticsDate: yesterday,
        salesQuantity: 8,
        salesAmount: 280000,
        rankPosition: 5,
      },

      // Two days ago
      {
        id: 11,
        productId: 101,
        statisticsDate: twoDaysAgo,
        salesQuantity: 18,
        salesAmount: 450000,
        rankPosition: 1,
      },
      {
        id: 12,
        productId: 102,
        statisticsDate: twoDaysAgo,
        salesQuantity: 14,
        salesAmount: 630000,
        rankPosition: 2,
      },
      {
        id: 13,
        productId: 107,
        statisticsDate: twoDaysAgo,
        salesQuantity: 12,
        salesAmount: 780000,
        rankPosition: 3,
      },
      {
        id: 14,
        productId: 103,
        statisticsDate: twoDaysAgo,
        salesQuantity: 6,
        salesAmount: 900000,
        rankPosition: 4,
      },
      {
        id: 15,
        productId: 108,
        statisticsDate: twoDaysAgo,
        salesQuantity: 9,
        salesAmount: 270000,
        rankPosition: 5,
      },
    ];

    statistics.forEach((statsData) => {
      const stats = new SalesStatistics();
      Object.assign(stats, statsData);
      stats.createdAt = new Date();
      stats.updatedAt = new Date();
      this.statistics.set(stats.id, stats);
    });

    this.currentId = Math.max(...statistics.map((s) => s.id)) + 1;
  }

  async findByProductId(productId: number): Promise<SalesStatistics[]> {
    return Array.from(this.statistics.values())
      .filter((s) => s.productId === productId)
      .sort((a, b) => b.statisticsDate.getTime() - a.statisticsDate.getTime());
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SalesStatistics[]> {
    return Array.from(this.statistics.values())
      .filter(
        (s) => s.statisticsDate >= startDate && s.statisticsDate <= endDate,
      )
      .sort((a, b) => b.statisticsDate.getTime() - a.statisticsDate.getTime());
  }

  async save(statistics: SalesStatistics): Promise<SalesStatistics> {
    statistics.updatedAt = new Date();
    this.statistics.set(statistics.id, statistics);
    return statistics;
  }

  async create(
    statisticsData: Partial<SalesStatistics>,
  ): Promise<SalesStatistics> {
    const statistics = new SalesStatistics();
    Object.assign(statistics, statisticsData);
    statistics.id = this.currentId++;
    statistics.createdAt = new Date();
    statistics.updatedAt = new Date();
    this.statistics.set(statistics.id, statistics);
    return statistics;
  }

  async findPopularProducts(
    filter: PopularProductFilter,
  ): Promise<PopularProductsResult> {
    const days = filter.days || 3;
    const top = filter.top || 5;

    const now = new Date();
    const toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fromDate = new Date(
      toDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000,
    );

    const relevantStats = Array.from(this.statistics.values()).filter(
      (s) => s.statisticsDate >= fromDate && s.statisticsDate <= toDate,
    );

    const productSummary = new Map<
      number,
      {
        quantity: number;
        amount: number;
        productName: string;
        price: number;
        stockQuantity: number;
        status: string;
      }
    >();

    relevantStats.forEach((stat) => {
      const existing = productSummary.get(stat.productId) || {
        quantity: 0,
        amount: 0,
        productName: '',
        price: 0,
        stockQuantity: 0,
        status: '',
      };
      existing.quantity += stat.salesQuantity;
      existing.amount += stat.salesAmount;

      // Mock product data (in real implementation, this would come from product repository)
      const mockProducts = new Map([
        [
          101,
          {
            name: '무선 마우스',
            price: 25000,
            stockQuantity: 50,
            status: 'ACTIVE',
          },
        ],
        [
          102,
          {
            name: '블루투스 키보드',
            price: 45000,
            stockQuantity: 30,
            status: 'ACTIVE',
          },
        ],
        [
          103,
          {
            name: '모니터',
            price: 150000,
            stockQuantity: 20,
            status: 'ACTIVE',
          },
        ],
        [
          105,
          { name: '스피커', price: 35000, stockQuantity: 25, status: 'ACTIVE' },
        ],
        [
          107,
          { name: '헤드셋', price: 65000, stockQuantity: 40, status: 'ACTIVE' },
        ],
        [
          108,
          {
            name: '노트북 스탠드',
            price: 30000,
            stockQuantity: 60,
            status: 'ACTIVE',
          },
        ],
      ]);

      const productInfo = mockProducts.get(stat.productId);
      if (productInfo) {
        existing.productName = productInfo.name;
        existing.price = productInfo.price;
        existing.stockQuantity = productInfo.stockQuantity;
        existing.status = productInfo.status;
      }

      productSummary.set(stat.productId, existing);
    });

    const sortedProducts = Array.from(productSummary.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, top);

    const items: PopularProductResult[] = sortedProducts.map(
      ([productId, summary], index) => ({
        rank: index + 1,
        productId,
        productName: summary.productName,
        price: summary.price,
        salesQuantity: summary.quantity,
        salesAmount: summary.amount,
        stockQuantity: summary.stockQuantity,
        status: summary.status,
      }),
    );

    const totalSalesCount = Array.from(productSummary.values()).reduce(
      (sum, p) => sum + p.quantity,
      0,
    );
    const totalSalesAmount = Array.from(productSummary.values()).reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    return {
      period: {
        fromDate: fromDate.getTime(),
        toDate: toDate.getTime(),
        days,
      },
      items,
      summary: {
        totalProducts: productSummary.size,
        totalSalesCount,
        totalSalesAmount,
      },
    };
  }

  async bulkSave(statistics: SalesStatistics[]): Promise<SalesStatistics[]> {
    return Promise.all(statistics.map((stat) => this.save(stat)));
  }
}
