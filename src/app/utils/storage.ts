import { DailyOrder, DailyReturn, DailySale, MorningDispatch, Product } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

type BootstrapData = {
  products: Product[];
  orders: DailyOrder[];
  sales: DailySale[];
  dispatches: MorningDispatch[];
  returns: DailyReturn[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const text = await response.text();
      if (text) {
        const body = JSON.parse(text);
        if (typeof body?.message === 'string') {
          message = body.message;
        } else {
          message = text;
        }
      }
    } catch {
      // If parsing fails, keep default message
    }
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const storage = {
  getBootstrap(): Promise<BootstrapData> {
    return request<BootstrapData>('/bootstrap');
  },

  getProducts(): Promise<Product[]> {
    return request<Product[]>('/products');
  },

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteProduct(id: string): Promise<void> {
    return request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  getProductById(id: string): Promise<Product | undefined> {
    return this.getProducts().then((products) => products.find((product) => product.id === id));
  },

  getOrders(): Promise<DailyOrder[]> {
    return request<DailyOrder[]>('/orders');
  },

  addOrder(order: Omit<DailyOrder, 'id' | 'createdAt'>): Promise<DailyOrder> {
    return request<DailyOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  getSales(): Promise<DailySale[]> {
    return request<DailySale[]>('/sales');
  },

  addSale(sale: Omit<DailySale, 'id' | 'createdAt'>): Promise<DailySale> {
    return request<DailySale>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  },

  getDispatches(): Promise<MorningDispatch[]> {
    return request<MorningDispatch[]>('/dispatches');
  },

  addDispatch(dispatch: Omit<MorningDispatch, 'id' | 'createdAt'>): Promise<MorningDispatch | null> {
    return request<MorningDispatch>('/dispatches', {
      method: 'POST',
      body: JSON.stringify(dispatch),
    }).catch((error) => {
      if (error instanceof Error && error.message.toLowerCase().includes('insufficient stock')) {
        return null;
      }
      throw error;
    });
  },

  getReturns(): Promise<DailyReturn[]> {
    return request<DailyReturn[]>('/returns');
  },

  addReturn(returnItem: Omit<DailyReturn, 'id' | 'createdAt'>): Promise<DailyReturn | null> {
    return request<DailyReturn>('/returns', {
      method: 'POST',
      body: JSON.stringify(returnItem),
    }).catch((error) => {
      if (error instanceof Error && error.message.toLowerCase().includes('product not found')) {
        return null;
      }
      throw error;
    });
  },

  getOrdersByProduct(productId: string): Promise<DailyOrder[]> {
    return this.getOrders().then((orders) => orders.filter((order) => order.productId === productId));
  },

  getSalesByProduct(productId: string): Promise<DailySale[]> {
    return this.getSales().then((sales) => sales.filter((sale) => sale.productId === productId));
  },

  getDispatchesByProduct(productId: string): Promise<MorningDispatch[]> {
    return this.getDispatches().then((dispatches) => dispatches.filter((dispatch) => dispatch.productId === productId));
  },

  getReturnsByProduct(productId: string): Promise<DailyReturn[]> {
    return this.getReturns().then((returns) => returns.filter((returnItem) => returnItem.productId === productId));
  },

  async getOrdersWithProductNames() {
    const [orders, products] = await Promise.all([this.getOrders(), this.getProducts()]);
    return orders.map((order) => ({
      ...order,
      productName: products.find((product) => product.id === order.productId)?.name || 'Unknown',
    }));
  },

  async getSalesWithProductNames() {
    const [sales, products] = await Promise.all([this.getSales(), this.getProducts()]);
    return sales.map((sale) => ({
      ...sale,
      productName: products.find((product) => product.id === sale.productId)?.name || 'Unknown',
    }));
  },

  async getDispatchesWithProductNames() {
    const [dispatches, products] = await Promise.all([this.getDispatches(), this.getProducts()]);
    return dispatches.map((dispatch) => ({
      ...dispatch,
      productName: products.find((product) => product.id === dispatch.productId)?.name || 'Unknown',
    }));
  },

  async getReturnsWithProductNames() {
    const [returns, products] = await Promise.all([this.getReturns(), this.getProducts()]);
    return returns.map((returnItem) => ({
      ...returnItem,
      productName: products.find((product) => product.id === returnItem.productId)?.name || 'Unknown',
    }));
  },
};
