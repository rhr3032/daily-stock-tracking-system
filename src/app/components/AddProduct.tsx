import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Package, Plus } from 'lucide-react';
import { storage } from '../utils/storage';

interface ProductFormData {
  name: string;
  totalQuantity: number;
  totalCost: number;
}

interface AddProductProps {
  onSuccess?: () => void;
}

export function AddProduct({ onSuccess }: AddProductProps) {
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ProductFormData>();

  const totalQuantity = watch('totalQuantity');
  const totalCost = watch('totalCost');
  const unitCost = totalQuantity && totalCost ? (totalCost / totalQuantity).toFixed(2) : '0.00';

  const onSubmit = (data: ProductFormData) => {
    const unitCost = data.totalCost / data.totalQuantity;

    storage.addProduct({
      name: data.name,
      totalQuantity: data.totalQuantity,
      totalCost: data.totalCost,
      unitCost: unitCost,
      currentStock: data.totalQuantity,
    });

    setSuccessMessage(`${data.name} added successfully!`);
    reset();
    setTimeout(() => {
      setSuccessMessage('');
      setShowForm(false);
      onSuccess?.();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Add Product</h1>
          <p className="text-gray-600">Add a new product to your inventory</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Product
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold">Product Details</h2>
              <p className="text-sm text-gray-600">Enter the product information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Product name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Rice Bag"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Quantity (pcs)
                </label>
                <input
                  type="number"
                  {...register('totalQuantity', {
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be at least 1' },
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                />
                {errors.totalQuantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.totalQuantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('totalCost', {
                    required: 'Cost is required',
                    min: { value: 0.01, message: 'Cost must be greater than 0' },
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 20000"
                />
                {errors.totalCost && (
                  <p className="text-red-500 text-sm mt-1">{errors.totalCost.message}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Calculated Unit Cost</p>
              <p className="text-2xl font-semibold text-blue-900">৳{unitCost}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <RecentProducts />
    </div>
  );
}

function RecentProducts() {
  const [products, setProducts] = useState(storage.getProducts());

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="mb-4">All Products</h2>
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No products added yet</p>
      ) : (
        <div className="space-y-3">
          {products.slice().reverse().map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{product.name}</h3>
                <span className="text-sm text-gray-600">Stock: {product.currentStock}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Qty</p>
                  <p className="font-medium">{product.totalQuantity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Cost</p>
                  <p className="font-medium">৳{product.totalCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Unit Cost</p>
                  <p className="font-medium">৳{product.unitCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock Value</p>
                  <p className="font-medium">৳{(product.currentStock * product.unitCost).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
