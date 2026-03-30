import axios from 'axios';

const API_BASE = 'https://rcx4z9asgh.execute-api.ap-northeast-1.amazonaws.com/prod';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  image_url: string;
  stock: number;
  alert_stock: number;
};

export type StockHistory = {
  id: number;
  product_id: number;
  product_name: string;
  type: 'in' | 'out';
  quantity: number;
  note: string;
  created_at: string;
};

export const api = {
  // カテゴリ
  getCategories: () => client.get<Category[]>('/categories'),

  // 商品
  getProducts: () => client.get<Product[]>('/products'),
  createProduct: (data: Omit<Product, 'id' | 'category_name' | 'image_url'>) =>
    client.post('/products', data),
  updateProduct: (id: number, data: Partial<Product>) =>
    client.put(`/products/${id}`, data),
  deleteProduct: (id: number) => client.delete(`/products/${id}`),

  // 在庫履歴
  getStockHistories: () => client.get<StockHistory[]>('/stock-histories'),
  createStockHistory: (data: { product_id: number; type: 'in' | 'out'; quantity: number; note: string }) =>
    client.post('/stock-histories', data),
};
