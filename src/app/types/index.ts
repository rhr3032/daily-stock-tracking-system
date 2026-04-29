export interface Product {
  id: string;
  name: string;
  totalQuantity: number;
  totalCost: number;
  unitCost: number;
  currentStock: number;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  date: string;
  orderedQty: number;
  returnedQty: number;
  soldQty: number;
  soldValue: number;
  productId: string;
  productName?: string;
  createdAt: string;
}
