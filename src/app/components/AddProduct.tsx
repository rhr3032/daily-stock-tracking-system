import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { storage } from '../utils/storage';
import { Product } from '../types';

interface ProductFormData {
  name: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  totalQuantity: number;
  lowStockThreshold: number;
}

interface AddProductProps {
  onSuccess?: () => void;
}

export function AddProduct({ onSuccess }: AddProductProps) {
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      lowStockThreshold: 10,
    },
  });

  const loadProducts = async () => {
    setProducts(await storage.getProducts());
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const totalQuantity = watch('totalQuantity') || 0;
  const purchasePrice = watch('purchasePrice') || 0;
  const sellingPrice = watch('sellingPrice') || 0;
  const grossProfitPerUnit = sellingPrice - purchasePrice;

  const onSubmit = async (data: ProductFormData) => {
    setErrorMessage('');
    try {
      await storage.addProduct({
        name: data.name,
        unit: data.unit,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        totalQuantity: data.totalQuantity,
        currentStock: data.totalQuantity,
        lowStockThreshold: data.lowStockThreshold,
      });

      setSuccessMessage(`${data.name} added successfully!`);
      reset({ lowStockThreshold: 10 });
      await loadProducts();
      setTimeout(() => {
        setSuccessMessage('');
        setShowForm(false);
        onSuccess?.();
      }, 1600);
    } catch (err) {
      console.error('Add product failed', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-white">Initial Stock Setup</h1>
          <p className="text-slate-400">Register products with purchase price, selling price, and opening inventory.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-emerald-400"
          >
            <Plus className="w-5 h-5" />
            New Product
          </button>
        )}
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-3">
              <Package className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Product Details</h2>
              <p className="text-sm text-slate-400">Enter the opening inventory and pricing structure.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="product-name" className="mb-2 block text-sm font-medium text-slate-300">Product Name</label>
              <input
                id="product-name"
                type="text"
                {...register('name', { required: 'Product name is required' })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                placeholder="e.g., Rice Bag"
              />
              {errors.name && <p className="mt-1 text-sm text-rose-400">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="product-unit" className="mb-2 block text-sm font-medium text-slate-300">Product Unit</label>
              <input
                id="product-unit"
                type="text"
                {...register('unit', { required: 'Product unit is required' })}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                placeholder="e.g., kg, pcs, bottle"
              />
              {errors.unit && <p className="mt-1 text-sm text-rose-400">{errors.unit.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="purchase-price" className="mb-2 block text-sm font-medium text-slate-300">Purchase Price (৳)</label>
                <input
                  id="purchase-price"
                  type="number"
                  step="0.01"
                  {...register('purchasePrice', {
                    required: 'Purchase price is required',
                    min: { value: 0.01, message: 'Purchase price must be greater than 0' },
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g., 120"
                />
                {errors.purchasePrice && <p className="mt-1 text-sm text-rose-400">{errors.purchasePrice.message}</p>}
              </div>

              <div>
                <label htmlFor="selling-price" className="mb-2 block text-sm font-medium text-slate-300">Selling Price (৳)</label>
                <input
                  id="selling-price"
                  type="number"
                  step="0.01"
                  {...register('sellingPrice', {
                    required: 'Selling price is required',
                    min: { value: 0.01, message: 'Selling price must be greater than 0' },
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g., 160"
                />
                {errors.sellingPrice && <p className="mt-1 text-sm text-rose-400">{errors.sellingPrice.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="opening-quantity" className="mb-2 block text-sm font-medium text-slate-300">Opening Quantity</label>
                <input
                  id="opening-quantity"
                  type="number"
                  {...register('totalQuantity', {
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be at least 1' },
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g., 1000"
                />
                {errors.totalQuantity && <p className="mt-1 text-sm text-rose-400">{errors.totalQuantity.message}</p>}
              </div>

              <div>
                <label htmlFor="low-stock-threshold" className="mb-2 block text-sm font-medium text-slate-300">Low Stock Threshold</label>
                <input
                  id="low-stock-threshold"
                  type="number"
                  {...register('lowStockThreshold', {
                    required: 'Threshold is required',
                    min: { value: 0, message: 'Threshold cannot be negative' },
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g., 20"
                />
                {errors.lowStockThreshold && <p className="mt-1 text-sm text-rose-400">{errors.lowStockThreshold.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Opening Stock Value</p>
                <p className="mt-1 text-2xl font-semibold text-white">৳{(totalQuantity * purchasePrice).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Projected Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-white">৳{(totalQuantity * sellingPrice).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Unit Margin</p>
                <p className={`mt-1 text-2xl font-semibold ${grossProfitPerUnit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  ৳{grossProfitPerUnit.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-cyan-500 px-6 py-3 font-medium text-slate-950 transition-colors hover:bg-cyan-400"
              >
                Add Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset({ lowStockThreshold: 10 });
                }}
                className="rounded-xl border border-white/10 px-6 py-3 text-slate-200 transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <RecentProducts searchTerm={searchTerm} setSearchTerm={setSearchTerm} products={products} onRefresh={loadProducts} />
    </div>
  );
}

function RecentProducts({
  searchTerm,
  setSearchTerm,
  products,
  onRefresh,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  products: Product[];
  onRefresh: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);
  const [editTotalQuantity, setEditTotalQuantity] = useState<number>(0);
  const [editLowStockThreshold, setEditLowStockThreshold] = useState<number>(0);

  const filteredProducts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.name, String(product.purchasePrice), String(product.sellingPrice)].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [products, searchTerm]);

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditUnit(product.unit || '');
    setEditPurchasePrice(product.purchasePrice);
    setEditSellingPrice(product.sellingPrice);
    setEditTotalQuantity(product.totalQuantity);
    setEditLowStockThreshold(product.lowStockThreshold);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (product: Product) => {
    if (editTotalQuantity < 1) return;
    const stockDelta = editTotalQuantity - product.totalQuantity;
    const newCurrentStock = Math.max(0, product.currentStock + stockDelta);

    await storage.updateProduct(product.id, {
      name: editName,
      unit: editUnit,
      purchasePrice: editPurchasePrice,
      sellingPrice: editSellingPrice,
      totalQuantity: editTotalQuantity,
      currentStock: newCurrentStock,
      lowStockThreshold: editLowStockThreshold,
    });

    setEditingId(null);
    await onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product and its linked records?')) return;
    await storage.deleteProduct(id);
    await onRefresh();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">All Products</h2>
          <p className="text-sm text-slate-400">Search, edit, and track stock status in one place.</p>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Search products or prices"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products or prices"
            className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products added yet</p>
      ) : filteredProducts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-400">No products match your search</p>
      ) : (
        <div className="space-y-3">
          {filteredProducts.slice().reverse().map((product) => {
            const isLow = product.currentStock <= product.lowStockThreshold && product.currentStock > 0;
            const isOut = product.currentStock === 0;
            const statusClass = isOut ? 'bg-rose-500/15 text-rose-300' : isLow ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300';
            const statusLabel = isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock';

            return (
              <div key={product.id} className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/7">
                {editingId === product.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Editing: {product.name}</h3>
                      <span className="text-sm text-slate-400">Available: {product.currentStock}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                      <input aria-label="Edit product name" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <input aria-label="Edit product unit" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder="Unit" />
                      <input aria-label="Edit purchase price" type="number" step="0.01" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" value={editPurchasePrice} onChange={(e) => setEditPurchasePrice(Number(e.target.value))} />
                      <input aria-label="Edit selling price" type="number" step="0.01" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" value={editSellingPrice} onChange={(e) => setEditSellingPrice(Number(e.target.value))} />
                      <input aria-label="Edit total quantity" type="number" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" value={editTotalQuantity} onChange={(e) => setEditTotalQuantity(Number(e.target.value))} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input aria-label="Edit low stock threshold" type="number" className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" value={editLowStockThreshold} onChange={(e) => setEditLowStockThreshold(Number(e.target.value))} />
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950" onClick={() => void saveEdit(product)}>Save</button>
                        <button className="rounded-lg border border-white/10 px-4 py-2 text-slate-200" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{product.name}</h3>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                        </div>
                        <p className="text-xs text-slate-400">{product.unit || 'Unit not set'} · Purchase ৳{product.purchasePrice.toFixed(2)} · Selling ৳{product.sellingPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Available: {product.currentStock}</span>
                        <button onClick={() => startEdit(product)} className="rounded-lg p-2 hover:bg-white/10" title="Edit">
                          <Edit className="w-4 h-4 text-cyan-300" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="rounded-lg p-2 hover:bg-white/10" title="Delete">
                          <Trash2 className="w-4 h-4 text-rose-300" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-slate-400">Opening Qty</p>
                        <p className="font-medium text-white">{product.totalQuantity}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Stock Value</p>
                        <p className="font-medium text-white">৳{(product.currentStock * product.purchasePrice).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Margin / Unit</p>
                        <p className="font-medium text-white">৳{(product.sellingPrice - product.purchasePrice).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Threshold</p>
                        <p className="font-medium text-white">{product.lowStockThreshold}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                      {isOut ? <AlertTriangle className="h-4 w-4 text-rose-300" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                      <span>
                        {isOut ? 'Restock immediately.' : isLow ? 'Inventory is approaching the alert threshold.' : 'Inventory is healthy.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}