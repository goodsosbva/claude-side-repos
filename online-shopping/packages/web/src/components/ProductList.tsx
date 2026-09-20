"use client";

import type { Product } from "@shop/shared";
import { ProductCard } from "@shop/ui";

export function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) return <p>상품이 없습니다.</p>;
  return (
    <div className="product-list">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
