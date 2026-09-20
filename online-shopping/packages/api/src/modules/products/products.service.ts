import { Injectable } from "@nestjs/common";
import type { Product } from "@shop/shared";

@Injectable()
export class ProductsService {
  private readonly items: Product[] = [
    { id: "p1", name: "샘플 상품 A", price: 19900, stock: 10, createdAt: new Date().toISOString() },
    { id: "p2", name: "샘플 상품 B", price: 34900, stock: 4, createdAt: new Date().toISOString() },
  ];

  findAll(): Product[] {
    return this.items;
  }

  findOne(id: string): Product | undefined {
    return this.items.find((p) => p.id === id);
  }
}
