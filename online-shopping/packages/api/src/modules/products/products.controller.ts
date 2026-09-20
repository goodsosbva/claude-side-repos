import { Controller, Get, Param } from "@nestjs/common";
import type { Product } from "@shop/shared";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(): Product[] {
    return this.products.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Product | undefined {
    return this.products.findOne(id);
  }
}
