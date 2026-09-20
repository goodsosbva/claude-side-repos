import type { OrderStatus } from "./enums";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  total: number;
}
