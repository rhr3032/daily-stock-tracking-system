import { useEffect, useMemo, useState } from 'react';
import { Calendar, ClipboardList, Package, Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { Product } from '../types';

export function DailyEntry() {
  const [products, setProducts] = useState<Product[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      const allProducts = await storage.getProducts();
      setProducts(allProducts);
      setQuantities(
        allProducts.reduce<Record<string, number>>((acc, product) => {
          acc[product.id] = 0;
          return acc;
        }, {}),
      );
    };

    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, searchTerm]);

  const totalOrdered = Object.values(quantities).reduce((sum, value) => sum + Number(value || 0), 0);
  const totalValue = products.reduce((sum, product) => sum + (Number(quantities[product.id] || 0) * product.sellingPrice), 0);

  const handleSave = async () => {
    const entries = products
      .map((product) => ({ product, quantity: Number(quantities[product.id] || 0) }))
      .filter((item) => item.quantity > 0);

    if (entries.length === 0) {
      return;
    }

    await Promise.all(entries.map(({ product, quantity }) => {
      return storage.addOrder({
        date,
        productId: product.id,
        quantity,
      });
    }));

    setSuccessMessage('Daily orders saved successfully.');
    setQuantities(
      products.reduce<Record<string, number>>((acc, product) => {
        acc[product.id] = 0;
        return acc;
      }, {}),
    );
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-white">Daily Order Collection</h1>
        <p className="text-slate-400">Capture daytime shop orders product by product.</p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          {successMessage}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-3">
            <Calendar className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Orders for the Day</h2>
            <p className="text-sm text-slate-400">Enter the quantities collected during the day.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              title="Order date"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Search Products</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name"
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products available for order collection</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-sm text-slate-400">
                      Selling price: ৳{product.sellingPrice.toFixed(2)} · Current stock: {product.currentStock}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    Low stock alert at {product.lowStockThreshold}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Collected Quantity</label>
                    <input
                      type="number"
                      min={0}
                      value={quantities[product.id] ?? 0}
                      onChange={(event) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product.id]: Number(event.target.value),
                        }))
                      }
                      title={`${product.name} order quantity`}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                    <p className="text-xs text-slate-400">Order Value</p>
                    <p className="text-lg font-semibold text-white">৳{(Number(quantities[product.id] || 0) * product.sellingPrice).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                    <p className="text-xs text-slate-400">Net Tracking</p>
                    <p className="text-lg font-semibold text-white">Stock unchanged until dispatch</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Ordered</p>
            <p className="mt-1 text-2xl font-semibold text-white">{totalOrdered.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Order Value</p>
            <p className="mt-1 text-2xl font-semibold text-white">৳{totalValue.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Saved For</p>
            <p className="mt-1 text-2xl font-semibold text-white">{date}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-medium text-slate-950 transition-colors hover:bg-cyan-400"
        >
          <ClipboardList className="w-5 h-5" />
          Save Daily Orders
        </button>
      </div>
    </div>
  );
}
