import { useEffect, useMemo, useState } from 'react';
import { Calendar, RotateCcw, Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { Product } from '../types';

export function EveningReturn() {
  const [products, setProducts] = useState<Product[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setProducts(storage.getProducts());
  }, []);

  useEffect(() => {
    const dispatches = storage.getDispatches().filter((dispatch) => dispatch.date === date);
    const returns = storage.getReturns().filter((entry) => entry.date === date);

    const nextQuantities = products.reduce<Record<string, number>>((acc, product) => {
      const dispatchedQty = dispatches
        .filter((dispatch) => dispatch.productId === product.id)
        .reduce((sum, dispatch) => sum + dispatch.quantity, 0);
      const returnedQty = returns
        .filter((entry) => entry.productId === product.id)
        .reduce((sum, entry) => sum + entry.quantity, 0);
      acc[product.id] = Math.max(0, dispatchedQty - returnedQty);
      return acc;
    }, {});

    setQuantities(nextQuantities);
  }, [date, products]);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, searchTerm]);

  const totalReturnQty = products.reduce((sum, product) => sum + Number(quantities[product.id] || 0), 0);
  const totalReturnAmount = products.reduce((sum, product) => sum + (Number(quantities[product.id] || 0) * product.sellingPrice), 0);

  const handleSave = () => {
    setErrorMessage('');

    const entries = products
      .map((product) => ({ product, quantity: Number(quantities[product.id] || 0) }))
      .filter((item) => item.quantity > 0);

    if (!entries.length) return;

    for (const item of entries) {
      const dispatchedQty = storage
        .getDispatches()
        .filter((dispatch) => dispatch.date === date && dispatch.productId === item.product.id)
        .reduce((sum, dispatch) => sum + dispatch.quantity, 0);

      const returnedQty = storage
        .getReturns()
        .filter((entry) => entry.date === date && entry.productId === item.product.id)
        .reduce((sum, entry) => sum + entry.quantity, 0);

      const remaining = dispatchedQty - returnedQty;
      if (item.quantity > remaining) {
        setErrorMessage(`Return quantity for ${item.product.name} exceeds the dispatched balance.`);
        return;
      }
    }

    entries.forEach(({ product, quantity }) => {
      storage.addReturn({
        date,
        productId: product.id,
        quantity,
        amount: quantity * product.sellingPrice,
      });
    });

    setSuccessMessage('Evening returns saved successfully.');
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-white">Afternoon Return Entry</h1>
        <p className="text-slate-400">Record returned goods and automatically restore stock.</p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">{successMessage}</div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">{errorMessage}</div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-500/15 p-3">
            <Calendar className="w-6 h-6 text-orange-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Select Date</h2>
            <p className="text-sm text-slate-400">Returns are validated against the dispatch balance for the selected day.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              title="Return date"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-orange-400 focus:outline-none"
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
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-orange-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/15 p-3">
            <RotateCcw className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Returned Goods</h2>
            <p className="text-sm text-slate-400">Enter the product-wise returned quantities for the selected date.</p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products available</p>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const dispatchTotal = storage
                .getDispatches()
                .filter((dispatch) => dispatch.date === date && dispatch.productId === product.id)
                .reduce((sum, dispatch) => sum + dispatch.quantity, 0);
              const currentReturn = storage
                .getReturns()
                .filter((entry) => entry.date === date && entry.productId === product.id)
                .reduce((sum, entry) => sum + entry.quantity, 0);
              const availableToReturn = Math.max(0, dispatchTotal - currentReturn);
              const quantity = quantities[product.id] ?? availableToReturn;

              return (
                <div key={product.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-slate-400">Available to return: {availableToReturn.toLocaleString()} · Return value uses selling price</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">Current stock: {product.currentStock}</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">Returned Quantity</label>
                      <input
                        type="number"
                        min={0}
                        max={availableToReturn}
                        value={quantity}
                        onChange={(event) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Number(event.target.value),
                          }))
                        }
                        title={`${product.name} return quantity`}
                        placeholder="0"
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-orange-400 focus:outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                      <p className="text-xs text-slate-400">Return Amount</p>
                      <p className="text-lg font-semibold text-white">৳{(Number(quantity || 0) * product.sellingPrice).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                      <p className="text-xs text-slate-400">Stock After Return</p>
                      <p className="text-lg font-semibold text-white">{(product.currentStock + Number(quantity || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Returned Quantity</p>
            <p className="mt-1 text-2xl font-semibold text-white">{totalReturnQty.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Return Amount</p>
            <p className="mt-1 text-2xl font-semibold text-white">৳{totalReturnAmount.toLocaleString()}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-medium text-slate-950 transition-colors hover:bg-orange-400"
        >
          <RotateCcw className="w-5 h-5" />
          Save Returns
        </button>
      </div>
    </div>
  );
}
