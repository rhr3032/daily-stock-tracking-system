import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Package, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { storage } from '../utils/storage';
import { Product } from '../types';

interface DailyEntryFormData {
  productId: string;
  date: string;
  orderedQty: number;
}

export function DailyEntry() {
  const [products, setProducts] = useState<Product[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const { register, handleSubmit, watch, reset, formState: { errors }, setError } = useForm<DailyEntryFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    setProducts(storage.getProducts());
  }, []);

  const productId = watch('productId');
  const orderedQty = watch('orderedQty') || 0;

  const selectedProduct = products.find(p => p.id === productId);
  const soldQty = Math.max(0, orderedQty);
  const soldValue = selectedProduct ? soldQty * selectedProduct.unitCost : 0;

  const onSubmit = (data: DailyEntryFormData) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) {
      setError('productId', {
        type: 'manual',
        message: 'Please select a product',
      });
      return;
    }

    const soldQty = data.orderedQty;
    if (soldQty > product.currentStock) {
      setError('orderedQty', {
        type: 'manual',
        message: `Cannot order more than available stock (${product.currentStock})`,
      });
      return;
    }

    const soldValue = soldQty * product.unitCost;

    storage.addLog({
      productId: data.productId,
      date: data.date,
      orderedQty: data.orderedQty,
      returnedQty: 0,
      soldQty,
      soldValue,
    });

    setSuccessMessage(`Daily entry recorded successfully!`);
    reset({
      date: new Date().toISOString().split('T')[0],
      productId: '',
      orderedQty: 0,
    });
    setProducts(storage.getProducts());

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Daily Entry</h1>
        <p className="text-gray-600">Record morning ordered quantities</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-50 p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold">New Transaction</h2>
            <p className="text-sm text-gray-600">Enter morning ordered quantity</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                {...register('productId', { required: 'Please select a product' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sizeUnit ? `(${product.sizeUnit})` : ''} (Available: {product.currentStock})
                  </option>
                ))}
              </select>
              {errors.productId && (
                <p className="text-red-500 text-sm mt-1">{errors.productId.message}</p>
              )}
            </div>
          </div>

          <div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordered Quantity (Morning)
              </label>
              <input
                type="number"
                {...register('orderedQty', {
                  required: 'Ordered quantity is required',
                  min: { value: 0, message: 'Cannot be negative' },
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 100"
              />
              {errors.orderedQty && (
                <p className="text-red-500 text-sm mt-1">{errors.orderedQty.message}</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-gray-800">Auto Calculations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CalcCard
                icon={<Package className="w-5 h-5 text-blue-600" />}
                label="Sold Quantity"
                value={soldQty.toLocaleString()}
                bgColor="bg-white"
              />
              <CalcCard
                icon={<DollarSign className="w-5 h-5 text-green-600" />}
                label="Sold Value"
                value={`৳${soldValue.toLocaleString()}`}
                bgColor="bg-white"
              />
              <CalcCard
                icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
                label="Remaining Stock"
                value={selectedProduct ? (selectedProduct.currentStock - soldQty).toLocaleString() : '0'}
                bgColor="bg-white"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Available Stock by Product</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between bg-white rounded px-3 py-2">
                  <span className="text-gray-700">{product.name} {product.sizeUnit ? `(${product.sizeUnit})` : ''}</span>
                  <span className="font-semibold">{product.currentStock.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Record Entry
          </button>
        </form>
      </div>
    </div>
  );
}

interface CalcCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}

function CalcCard({ icon, label, value, bgColor }: CalcCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
