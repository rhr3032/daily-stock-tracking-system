import { useEffect, useState } from 'react';
import { Package, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { storage } from '../utils/storage';
import { Product, DailyLog } from '../types';

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allProducts = storage.getProducts();
    setProducts(allProducts);

    const today = new Date().toISOString().split('T')[0];
    const logs = storage.getLogs().filter(log => log.date.startsWith(today));
    setTodayLogs(logs);
  };

  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0);
  const todayOrdered = todayLogs.reduce((sum, log) => sum + log.orderedQty, 0);
  const todayReturned = todayLogs.reduce((sum, log) => sum + log.returnedQty, 0);
  const todaySold = todayLogs.reduce((sum, log) => sum + log.soldQty, 0);
  const todaySalesValue = todayLogs.reduce((sum, log) => sum + log.soldValue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your inventory and today's sales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-6 h-6 text-blue-600" />}
          label="Total Stock"
          value={totalStock.toLocaleString()}
          subValue={`৳${totalStockValue.toLocaleString()}`}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          label="Today Ordered"
          value={todayOrdered.toLocaleString()}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<TrendingDown className="w-6 h-6 text-orange-600" />}
          label="Today Returned"
          value={todayReturned.toLocaleString()}
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          label="Today Sales"
          value={todaySold.toLocaleString()}
          subValue={`৳${todaySalesValue.toLocaleString()}`}
          bgColor="bg-purple-50"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="mb-4">Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No products yet. Add your first product to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Product Name</th>
                  <th className="text-right py-3 px-4">Unit Cost</th>
                  <th className="text-right py-3 px-4">Available Stock</th>
                  <th className="text-right py-3 px-4">Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p>{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sizeUnit || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">৳{product.unitCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">{product.currentStock.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">৳{(product.currentStock * product.unitCost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  bgColor: string;
}

function StatCard({ icon, label, value, subValue, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
