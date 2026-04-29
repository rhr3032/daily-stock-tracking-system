import { Product, DailyLog } from '../types';

const PRODUCTS_KEY = 'stock_products';
const LOGS_KEY = 'stock_logs';

export const storage = {
  // Products
  getProducts(): Product[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
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

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  },

  // Logs
  getLogs(): DailyLog[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveLogs(logs: DailyLog[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  },

  addLog(log: Omit<DailyLog, 'id' | 'createdAt'>): DailyLog {
    const logs = this.getLogs();
    const products = this.getProducts();

    const newLog: DailyLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    logs.push(newLog);
    this.saveLogs(logs);

    // Update product stock
    const productIndex = products.findIndex(p => p.id === log.productId);
    if (productIndex !== -1) {
      products[productIndex].currentStock -= log.soldQty;
      this.saveProducts(products);
    }

    return newLog;
  },

  getLogsByProduct(productId: string): DailyLog[] {
    return this.getLogs().filter(log => log.productId === productId);
  },

  getLogsWithProductNames(): DailyLog[] {
    const logs = this.getLogs();
    const products = this.getProducts();
    return logs.map(log => ({
      ...log,
      productName: products.find(p => p.id === log.productId)?.name || 'Unknown',
    }));
  },
};
