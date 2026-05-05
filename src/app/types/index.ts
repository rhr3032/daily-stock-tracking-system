export interface Product {
  id: string;
  name: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  totalQuantity: number;
  currentStock: number;
  lowStockThreshold: number;
  createdAt: string;
}

export interface DailyOrder {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  createdAt: string;
}

export interface DailySale {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  amount: number;
  createdAt: string;
}

export interface MorningDispatch {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  createdAt: string;
}

export interface DailyReturn {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  amount: number;
  createdAt: string;
}

export interface ProductWithName extends DailyOrder {
  productName?: string;
}
