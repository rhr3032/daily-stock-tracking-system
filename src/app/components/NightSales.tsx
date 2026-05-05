import { useEffect, useMemo, useState } from 'react';
import { ReceiptText, Calendar, Search, DollarSign } from 'lucide-react';
import { storage } from '../utils/storage';
import { DailyOrder, Product } from '../types';

export function NightSales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [allProducts, allOrders] = await Promise.all([storage.getProducts(), storage.getOrders()]);
      setProducts(allProducts);
      setOrders(allOrders);
      setQuantities(
        allProducts.reduce<Record<string, number>>((acc, product) => {
          acc[product.id] = 0;
          return acc;
        }, {}),
      );
    };

    void loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, searchTerm]);

  const totalSales = products.reduce((sum, product) => sum + (Number(quantities[product.id] || 0) * product.sellingPrice), 0);
  const totalQuantity = Object.values(quantities).reduce((sum, value) => sum + Number(value || 0), 0);
  const orderTotals = orders
    .filter((order) => order.date === date)
    .reduce<Record<string, number>>((acc, order) => {
      acc[order.productId] = (acc[order.productId] || 0) + order.quantity;
      return acc;
    }, {});

  const handleSave = async () => {
    const entries = products
      .map((product) => ({ product, quantity: Number(quantities[product.id] || 0) }))
      .filter((item) => item.quantity > 0);

    if (!entries.length) return;

    const invalidItem = entries.find((item) => item.quantity > (orderTotals[item.product.id] ?? 0));
    if (invalidItem) {
      alert(`Sold quantity for ${invalidItem.product.name} cannot exceed the collected order quantity for the day.`);
      return;
    }

    await Promise.all(entries.map(({ product, quantity }) => {
      return storage.addSale({
        date,
        productId: product.id,
        quantity,
        amount: quantity * product.sellingPrice,
      });
    }));

    setSuccessMessage('Night sales recorded successfully.');
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
        <h1 className="mb-2 text-3xl font-semibold text-white">Night Sales Input</h1>
        <p className="text-slate-400">Record sold quantities and total sales amount for the day.</p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          {successMessage}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-fuchsia-500/15 p-3">
            <ReceiptText className="w-6 h-6 text-fuchsia-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Sold Products</h2>
            <p className="text-sm text-slate-400">Enter the quantities sold at night. Stock is updated on dispatch, not on sale entry.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              title="Sales date"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-fuchsia-400 focus:outline-none"
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
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products available for sales entry</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-sm text-slate-400">Selling price: ৳{product.sellingPrice.toFixed(2)}</p>
                  </div>
                    <div className="text-right text-xs text-slate-400">
                      Profit per unit: ৳{(product.sellingPrice - product.purchasePrice).toFixed(2)}
                      <br />
                      Ordered today: {orderTotals[product.id] || 0}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Sold Quantity</label>
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
                      title={`${product.name} sold quantity`}
                      placeholder="0"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-fuchsia-400 focus:outline-none"
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                    <p className="text-xs text-slate-400">Sales Amount</p>
                    <p className="text-lg font-semibold text-white">৳{(Number(quantities[product.id] || 0) * product.sellingPrice).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                    <p className="text-xs text-slate-400">Projected Gross Profit</p>
                    <p className="text-lg font-semibold text-white">৳{(Number(quantities[product.id] || 0) * (product.sellingPrice - product.purchasePrice)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Quantity Sold</p>
            <p className="mt-1 text-2xl font-semibold text-white">{totalQuantity.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Sales Amount</p>
            <p className="mt-1 text-2xl font-semibold text-white">৳{totalSales.toLocaleString()}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-6 py-3 font-medium text-white transition-colors hover:bg-fuchsia-400"
        >
          <DollarSign className="w-5 h-5" />
          Save Night Sales
        </button>
      </div>
    </div>
  );
}
