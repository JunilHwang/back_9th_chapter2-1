import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PopularProductFilter,
  PopularProductsResult,
  ProductFilter,
  ProductRepository,
  SalesStatisticsRepository,
} from '../repositories';
import { Product } from '../entities';

export interface GetProductResponse {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  status: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  status: string;
  createdAt: number;
}

export interface GetProductsResponse {
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

@Injectable()
export class ProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly salesStatisticsRepository: SalesStatisticsRepository,
  ) {}

  async getProducts(filter: ProductFilter): Promise<GetProductsResponse> {
    // 파라미터 유효성 검증
    if (filter.page && filter.page < 1) {
      throw new BadRequestException('페이지 번호는 1 이상이어야 합니다.');
    }

    if (filter.size && (filter.size < 1 || filter.size > 100)) {
      throw new BadRequestException('페이지 크기는 1-100 사이여야 합니다.');
    }

    const result = await this.productRepository.findAll(filter);

    const items: ProductSummary[] = result.items.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stockQuantity: product.stockQuantity,
      status: product.status,
      createdAt: product.createdAt.getTime(),
    }));

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

  async getProduct(productId: number): Promise<GetProductResponse> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stockQuantity: product.stockQuantity,
      status: product.status,
      description: product.description,
      createdAt: product.createdAt.getTime(),
      updatedAt: product.updatedAt.getTime(),
    };
  }

  async getPopularProducts(
    filter: PopularProductFilter,
  ): Promise<PopularProductsResult> {
    // 파라미터 유효성 검증
    if (filter.days && (filter.days < 1 || filter.days > 30)) {
      throw new BadRequestException('조회 일수는 1-30 사이여야 합니다.');
    }

    if (filter.top && (filter.top < 1 || filter.top > 50)) {
      throw new BadRequestException('상위 상품 개수는 1-50 사이여야 합니다.');
    }

    return await this.salesStatisticsRepository.findPopularProducts(filter);
  }

  async validateProductsForOrder(productIds: number[]): Promise<Product[]> {
    const products = await this.productRepository.findByIds(productIds);

    for (const productId of productIds) {
      const product = products.find((p) => p.id === productId);
      if (!product) {
        throw new NotFoundException(`상품 ID ${productId}를 찾을 수 없습니다.`);
      }

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `상품 '${product.name}'은 현재 판매중이 아닙니다.`,
        );
      }
    }

    return products;
  }

  async checkStockAvailability(
    productId: number,
    quantity: number,
  ): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException('재고가 부족합니다.');
    }
  }

  async decreaseStock(productId: number, quantity: number): Promise<void> {
    await this.productRepository.decreaseStock(productId, quantity);
  }
}
