import { useEffect, useMemo, useState } from 'react';
import { Truck, ArrowRight } from 'lucide-react';
import { storage } from '../utils/storage';
import { Product, DailySale } from '../types';

export function MorningDispatch() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [suggestedQuantities, setSuggestedQuantities] = useState<Record<string, number>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await storage.getBootstrap();
        setProducts(data.products);

        const selected = new Date(date);
        selected.setDate(selected.getDate() - 1);
        const previousDate = selected.toISOString().split('T')[0];

        const previousSales = data.sales.filter((sale) => sale.date === previousDate);
        setSales(previousSales);
        setSuggestedQuantities(
          previousSales.reduce<Record<string, number>>((acc, sale) => {
            acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
            return acc;
          }, {}),
        );
        setQuantities({});
        setSelectedProductId('');
        setSelectedQuantity(0);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [date]);

  const suggestedTotal = useMemo(
    () => Object.values(quantities).reduce((sum, value) => sum + Number(value || 0), 0),
    [quantities],
  );

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedProductSuggested = selectedProductId ? suggestedQuantities[selectedProductId] || 0 : 0;

  const handleAddProduct = () => {
    if (!selectedProductId) {
      alert('Please select a product');
      return;
    }
    if (selectedQuantity <= 0) {
      alert('Please enter a quantity greater than 0');
      return;
    }
    if (!selectedProduct || selectedQuantity > selectedProduct.currentStock) {
      alert(`${selectedProduct?.name || 'Selected product'} does not have enough stock for dispatch.`);
      return;
    }

    setQuantities((prev) => ({
      ...prev,
      [selectedProductId]: selectedQuantity,
    }));
    setSelectedQuantity(0);
    setSelectedProductId('');
  };

  const handleSave = async () => {
    const items = Object.entries(quantities)
      .map(([productId, quantity]) => ({ productId, quantity: Number(quantity || 0) }))
      .filter((item) => item.quantity > 0);

    if (!items.length) return;

    const invalidItem = items.find((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return !product || item.quantity > product.currentStock;
    });

    if (invalidItem) {
      const product = products.find((entry) => entry.id === invalidItem.productId);
      alert(`${product?.name || 'Unknown product'} does not have enough stock for dispatch.`);
      return;
    }

    for (const item of items) {
      const saved = await storage.addDispatch({
        date,
        productId: item.productId,
        quantity: item.quantity,
      });
      if (!saved) {
        const product = products.find((entry) => entry.id === item.productId);
        alert(`${product?.name || 'Unknown product'} does not have enough stock for dispatch.`);
        return;
      }
    }

    setSuccessMessage('Morning dispatch saved successfully.');
    const data = await storage.getBootstrap();
    setProducts(data.products);
    const selected = new Date(date);
    selected.setDate(selected.getDate() - 1);
    const previousDate = selected.toISOString().split('T')[0];
    const previousSales = data.sales.filter((sale) => sale.date === previousDate);
    setSales(previousSales);
    setSuggestedQuantities(
      previousSales.reduce<Record<string, number>>((acc, sale) => {
        acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
        return acc;
      }, {}),
    );
    setQuantities({});
    setSelectedProductId('');
    setSelectedQuantity(0);
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-white">Morning Dispatch</h1>
        <p className="text-slate-400">Prepare goods for delivery based on the previous day&apos;s sales.</p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          {successMessage}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/15 p-3">
            <Truck className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Dispatch for Delivery Date</h2>
            <p className="text-sm text-slate-400">The list is auto-suggested from the previous day&apos;s sales.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Dispatch Date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              title="Dispatch date"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Suggested Dispatch Total</p>
            <p className="mt-1 text-2xl font-semibold text-white">{suggestedTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-sm font-medium text-white">Select Product Manually</p>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-amber-400">No products available. Please add products first from the "Add Product" page.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-400">Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value)}
                    title="Select product"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Dispatch Quantity</label>
                  <input
                    type="number"
                    min={0}
                    max={selectedProduct?.currentStock || 0}
                    value={selectedQuantity}
                    onChange={(event) => setSelectedQuantity(Number(event.target.value) || 0)}
                    title="Selected product dispatch quantity"
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="w-full rounded-xl bg-amber-500 px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-amber-400"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            {selectedProduct && (
              <p className="mt-3 text-sm text-slate-400">
                Suggested from yesterday: {selectedProductSuggested.toLocaleString()} · Stock available: {selectedProduct.currentStock.toLocaleString()}
              </p>
            )}
          </div>

          {products.length === 0 ? null : Object.values(quantities).every((quantity) => Number(quantity || 0) <= 0) ? (
            <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products selected for dispatch yet.</p>
          ) : (
            Object.entries(quantities)
              .filter(([, quantity]) => Number(quantity) > 0)
              .map(([productId, quantity]) => {
                const product = products.find((entry) => entry.id === productId);
                if (!product) return null;

                const suggested = Number(quantity || 0);
                const previousSalesQty = sales
                  .filter((sale) => sale.productId === product.id)
                  .reduce((sum, sale) => sum + sale.quantity, 0);

              return (
                <div key={product.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-slate-400">
                        Previous sales: {previousSalesQty} · Stock available: {product.currentStock}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((prev) => {
                          const next = { ...prev };
                          delete next[product.id];
                          return next;
                        })
                      }
                      className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">Dispatch Quantity</label>
                      <input
                        type="number"
                        min={0}
                        max={product.currentStock}
                        value={suggested}
                        onChange={(event) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Number(event.target.value),
                          }))
                        }
                        title={`${product.name} dispatch quantity`}
                        placeholder="0"
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                      <p className="text-xs text-slate-400">Value at Cost</p>
                      <p className="text-lg font-semibold text-white">৳{(suggested * product.purchasePrice).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
                      <p className="text-xs text-slate-400">Post Dispatch Stock</p>
                      <p className="text-lg font-semibold text-white">{Math.max(0, product.currentStock - suggested).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
              })
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-medium text-slate-950 transition-colors hover:bg-amber-400"
        >
          <ArrowRight className="w-5 h-5" />
          Save Dispatch
        </button>
      </div>
    </div>
  );
}
