import type { Product } from "@shop/shared";
import { ProductList } from "@/components/ProductList";

async function getProducts(): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/products`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function HomePage() {
  const products = await getProducts();
  return (
    <main>
      <h1>상품 목록</h1>
      <ProductList products={products} />
    </main>
  );
}
