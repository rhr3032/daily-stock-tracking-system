import { useEffect, useMemo, useState } from 'react';
import { Calendar, RotateCcw, Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { Product, MorningDispatch, DailyReturn } from '../types';

export function EveningReturn() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dispatches, setDispatches] = useState<MorningDispatch[]>([]);
  const [returns, setReturns] = useState<DailyReturn[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableToReturnByProduct, setAvailableToReturnByProduct] = useState<Record<string, number>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [allProducts, nextDispatches, nextReturns] = await Promise.all([
        storage.getProducts(),
        storage.getDispatches(),
        storage.getReturns(),
      ]);

      setProducts(allProducts);
      setDispatches(nextDispatches);
      setReturns(nextReturns);

      const nextAvailableToReturn = allProducts.reduce<Record<string, number>>((acc, product) => {
        const dispatchedQty = nextDispatches
          .filter((dispatch) => dispatch.date === date && dispatch.productId === product.id)
          .reduce((sum, dispatch) => sum + dispatch.quantity, 0);
        const returnedQty = nextReturns
          .filter((entry) => entry.date === date && entry.productId === product.id)
          .reduce((sum, entry) => sum + entry.quantity, 0);
        acc[product.id] = Math.max(0, dispatchedQty - returnedQty);
        return acc;
      }, {});

      setAvailableToReturnByProduct(nextAvailableToReturn);
      setQuantities({});
      setSelectedProductId('');
      setSelectedQuantity(0);
    };

    void loadData();
  }, [date]);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, searchTerm]);

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedAvailableToReturn = selectedProductId ? availableToReturnByProduct[selectedProductId] || 0 : 0;

  const handleAddProduct = () => {
    setErrorMessage('');

    if (!selectedProductId) {
      setErrorMessage('Please select a product');
      return;
    }

    if (selectedQuantity <= 0) {
      setErrorMessage('Please enter a return quantity greater than 0');
      return;
    }

    if (!selectedProduct) {
      setErrorMessage('Please select a valid product.');
      return;
    }

    if (selectedQuantity > selectedAvailableToReturn) {
      setErrorMessage(`Return quantity for ${selectedProduct.name} exceeds the dispatched balance.`);
      return;
    }

    setQuantities((prev) => ({
      ...prev,
      [selectedProductId]: selectedQuantity,
    }));
    setSelectedQuantity(0);
    setSelectedProductId('');
  };

  const totalReturnQty = Object.values(quantities).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
  const totalReturnAmount = Object.entries(quantities).reduce((sum, [productId, quantity]) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product) return sum;
    return sum + Number(quantity || 0) * product.sellingPrice;
  }, 0);

  const handleSave = async () => {
    setErrorMessage('');

    const entries = Object.entries(quantities)
      .map(([productId, quantity]) => {
        const product = products.find((entry) => entry.id === productId);
        return {
          product,
          quantity: Number(quantity || 0),
        };
      })
      .filter((item): item is { product: Product; quantity: number } => Boolean(item.product))
      .filter((item) => item.quantity > 0);

    if (!entries.length) return;

    const [dispatches, returns] = await Promise.all([storage.getDispatches(), storage.getReturns()]);

    for (const item of entries) {
      const dispatchedQty = dispatches
        .filter((dispatch) => dispatch.date === date && dispatch.productId === item.product.id)
        .reduce((sum, dispatch) => sum + dispatch.quantity, 0);

      const returnedQty = returns
        .filter((entry) => entry.date === date && entry.productId === item.product.id)
        .reduce((sum, entry) => sum + entry.quantity, 0);

      const remaining = dispatchedQty - returnedQty;
      if (item.quantity > remaining) {
        setErrorMessage(`Return quantity for ${item.product.name} exceeds the dispatched balance.`);
        return;
      }
    }

    for (const { product, quantity } of entries) {
      const saved = await storage.addReturn({
        date,
        productId: product.id,
        quantity,
        amount: quantity * product.sellingPrice,
      });
      if (!saved) {
        setErrorMessage(`Unable to save return for ${product.name}.`);
        return;
      }
    }

    setSuccessMessage('Evening returns saved successfully.');
    const [allProducts, nextDispatches, nextReturns] = await Promise.all([
      storage.getProducts(),
      storage.getDispatches(),
      storage.getReturns(),
    ]);
    setProducts(allProducts);
    const nextAvailableToReturn = allProducts.reduce<Record<string, number>>((acc, product) => {
      const dispatchedQty = nextDispatches
        .filter((dispatch) => dispatch.date === date && dispatch.productId === product.id)
        .reduce((sum, dispatch) => sum + dispatch.quantity, 0);
      const returnedQty = nextReturns
        .filter((entry) => entry.date === date && entry.productId === product.id)
        .reduce((sum, entry) => sum + entry.quantity, 0);
      acc[product.id] = Math.max(0, dispatchedQty - returnedQty);
      return acc;
    }, {});
    setAvailableToReturnByProduct(nextAvailableToReturn);
    setQuantities({});
    setSelectedProductId('');
    setSelectedQuantity(0);
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
            <p className="text-sm text-slate-400">Select products manually, then enter returned quantities for the selected date.</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm font-medium text-white">Select Product Manually</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">Product</label>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                title="Select product"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-orange-400 focus:outline-none"
              >
                <option value="">Select a product</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Return Quantity</label>
              <input
                type="number"
                min={0}
                max={selectedAvailableToReturn}
                value={selectedQuantity}
                onChange={(event) => setSelectedQuantity(Number(event.target.value) || 0)}
                title="Selected product return quantity"
                placeholder="0"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-orange-400 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddProduct}
                className="w-full rounded-xl bg-orange-500 px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-orange-400"
              >
                Add
              </button>
            </div>
          </div>
          {selectedProduct && (
            <p className="mt-3 text-sm text-slate-400">
              Available to return: {selectedAvailableToReturn.toLocaleString()} · Current stock: {selectedProduct.currentStock.toLocaleString()}
            </p>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products available</p>
        ) : Object.values(quantities).every((quantity) => Number(quantity || 0) <= 0) ? (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products selected for return yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(quantities)
              .filter(([, quantity]) => Number(quantity) > 0)
              .map(([productId, quantity]) => {
                const product = products.find((entry) => entry.id === productId);
                if (!product) return null;
                const availableToReturn = availableToReturnByProduct[product.id] || 0;

              return (
                <div key={product.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-slate-400">Available to return: {availableToReturn.toLocaleString()} · Return value uses selling price</p>
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
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">Returned Quantity</label>
                      <input
                        type="number"
                        min={0}
                        max={availableToReturn}
                        value={Number(quantity || 0)}
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
          onClick={() => void handleSave()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-medium text-slate-950 transition-colors hover:bg-orange-400"
        >
          <RotateCcw className="w-5 h-5" />
          Save Returns
        </button>
      </div>
    </div>
  );
}
