import {
  Product,
  DailyOrder,
  DailySale,
  MorningDispatch,
  DailyReturn,
} from '../types';

const PRODUCTS_KEY = 'stock_products';
const ORDERS_KEY = 'stock_orders';
const SALES_KEY = 'stock_sales';
const DISPATCHES_KEY = 'stock_dispatches';
const RETURNS_KEY = 'stock_returns';

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function writeArray<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeProduct(product: Partial<Product> & { id: string; createdAt?: string }): Product {
  return {
    id: product.id,
    name: product.name || 'Unknown Product',
    unit: product.unit,
    purchasePrice: Number(product.purchasePrice ?? 0),
    sellingPrice: Number(product.sellingPrice ?? 0),
    totalQuantity: Number(product.totalQuantity ?? 0),
    currentStock: Number(product.currentStock ?? product.totalQuantity ?? 0),
    lowStockThreshold: Number(product.lowStockThreshold ?? 10),
    createdAt: product.createdAt || new Date().toISOString(),
  };
}

export const storage = {
  getProducts(): Product[] {
    return readArray<Partial<Product> & { id: string; createdAt?: string }>(PRODUCTS_KEY).map(normalizeProduct);
  },

  saveProducts(products: Product[]): void {
    writeArray(PRODUCTS_KEY, products);
  },

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveProducts(products);
    }
  },

  deleteProduct(id: string): void {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);
    this.saveOrders(this.getOrders().filter(item => item.productId !== id));
    this.saveSales(this.getSales().filter(item => item.productId !== id));
    this.saveDispatches(this.getDispatches().filter(item => item.productId !== id));
    this.saveReturns(this.getReturns().filter(item => item.productId !== id));
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  },

  getOrders(): DailyOrder[] {
    return readArray<DailyOrder>(ORDERS_KEY);
  },

  saveOrders(orders: DailyOrder[]): void {
    writeArray(ORDERS_KEY, orders);
  },

  addOrder(order: Omit<DailyOrder, 'id' | 'createdAt'>): DailyOrder {
    const orders = this.getOrders();
    const newOrder: DailyOrder = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    this.saveOrders(orders);
    return newOrder;
  },

  getSales(): DailySale[] {
    return readArray<DailySale>(SALES_KEY);
  },

  saveSales(sales: DailySale[]): void {
    writeArray(SALES_KEY, sales);
  },

  addSale(sale: Omit<DailySale, 'id' | 'createdAt'>): DailySale {
    const sales = this.getSales();
    const newSale: DailySale = {
      ...sale,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    sales.push(newSale);
    this.saveSales(sales);
    return newSale;
  },

  getDispatches(): MorningDispatch[] {
    return readArray<MorningDispatch>(DISPATCHES_KEY);
  },

  saveDispatches(dispatches: MorningDispatch[]): void {
    writeArray(DISPATCHES_KEY, dispatches);
  },

  addDispatch(dispatch: Omit<MorningDispatch, 'id' | 'createdAt'>): MorningDispatch | null {
    const products = this.getProducts();
    const productIndex = products.findIndex(product => product.id === dispatch.productId);
    if (productIndex !== -1) {
      if (dispatch.quantity > products[productIndex].currentStock) return null;
      products[productIndex].currentStock -= dispatch.quantity;
      this.saveProducts(products);
    }

    const dispatches = this.getDispatches();
    const newDispatch: MorningDispatch = {
      ...dispatch,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    dispatches.push(newDispatch);
    this.saveDispatches(dispatches);
    return newDispatch;
  },

  getReturns(): DailyReturn[] {
    return readArray<DailyReturn>(RETURNS_KEY);
  },

  saveReturns(returns: DailyReturn[]): void {
    writeArray(RETURNS_KEY, returns);
  },

  addReturn(returnItem: Omit<DailyReturn, 'id' | 'createdAt'>): DailyReturn | null {
    const products = this.getProducts();
    const productIndex = products.findIndex(product => product.id === returnItem.productId);
    if (productIndex === -1) return null;

    products[productIndex].currentStock += returnItem.quantity;
    this.saveProducts(products);

    const returns = this.getReturns();
    const newReturn: DailyReturn = {
      ...returnItem,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    returns.push(newReturn);
    this.saveReturns(returns);
    return newReturn;
  },

  addProductPurchaseAndAlert(productId: string, quantity: number): void {
    const products = this.getProducts();
    const productIndex = products.findIndex(product => product.id === productId);
    if (productIndex === -1) return;

    products[productIndex].currentStock += quantity;
    this.saveProducts(products);
  },

  getOrdersByProduct(productId: string): DailyOrder[] {
    return this.getOrders().filter(order => order.productId === productId);
  },

  getSalesByProduct(productId: string): DailySale[] {
    return this.getSales().filter(sale => sale.productId === productId);
  },

  getDispatchesByProduct(productId: string): MorningDispatch[] {
    return this.getDispatches().filter(dispatch => dispatch.productId === productId);
  },

  getReturnsByProduct(productId: string): DailyReturn[] {
    return this.getReturns().filter(returnItem => returnItem.productId === productId);
  },

  getOrdersWithProductNames() {
    const orders = this.getOrders();
    const products = this.getProducts();
    return orders.map(order => ({
      ...order,
      productName: products.find(product => product.id === order.productId)?.name || 'Unknown',
    }));
  },

  getSalesWithProductNames() {
    const sales = this.getSales();
    const products = this.getProducts();
    return sales.map(sale => ({
      ...sale,
      productName: products.find(product => product.id === sale.productId)?.name || 'Unknown',
    }));
  },

  getDispatchesWithProductNames() {
    const dispatches = this.getDispatches();
    const products = this.getProducts();
    return dispatches.map(dispatch => ({
      ...dispatch,
      productName: products.find(product => product.id === dispatch.productId)?.name || 'Unknown',
    }));
  },

  getReturnsWithProductNames() {
    const returns = this.getReturns();
    const products = this.getProducts();
    return returns.map(returnItem => ({
      ...returnItem,
      productName: products.find(product => product.id === returnItem.productId)?.name || 'Unknown',
    }));
  },
};
