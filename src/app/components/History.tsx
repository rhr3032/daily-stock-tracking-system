import { useState, useEffect } from 'react';
import { History as HistoryIcon, Filter, Download } from 'lucide-react';
import { storage } from '../utils/storage';
import { DailyLog, Product } from '../types';

export function History() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterProduct, setFilterProduct] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allLogs = storage.getLogsWithProductNames();
    setLogs(allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setProducts(storage.getProducts());
  };

  const filteredLogs = logs.filter(log => {
    if (filterProduct && log.productId !== filterProduct) return false;
    if (filterDateFrom && log.date < filterDateFrom) return false;
    if (filterDateTo && log.date > filterDateTo) return false;
    return true;
  });

  const totalSales = filteredLogs.reduce((sum, log) => sum + log.soldValue, 0);
  const totalSold = filteredLogs.reduce((sum, log) => sum + log.soldQty, 0);

  const getAvailableStock = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    return product ? product.currentStock : 0;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Product', 'Ordered', 'Returned', 'Sold', 'Value (৳)'];
    const rows = filteredLogs.map(log => [
      log.date,
      log.productName || 'Unknown',
      log.orderedQty,
      log.returnedQty,
      log.soldQty,
      log.soldValue.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Sales History</h1>
          <p className="text-gray-600">View and filter past transactions</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          disabled={filteredLogs.length === 0}
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Filter className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold">Filters</h2>
            <p className="text-sm text-gray-600">Filter transactions by date and product</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product
            </label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {(filterProduct || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => {
              setFilterProduct('');
              setFilterDateFrom('');
              setFilterDateTo('');
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <p className="text-sm text-purple-800 mb-1">Total Quantity Sold</p>
          <p className="text-3xl font-bold text-purple-900">{totalSold.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-800 mb-1">Total Sales Value</p>
          <p className="text-3xl font-bold text-green-900">৳{totalSales.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-3 rounded-lg">
              <HistoryIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold">Transaction Log</h2>
              <p className="text-sm text-gray-600">{filteredLogs.length} entries found</p>
            </div>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Ordered</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Returned</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Sold</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Available Stock</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(log.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4">{log.productName}</td>
                    <td className="py-3 px-4 text-right text-blue-600 font-medium">
                      {log.orderedQty.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-orange-600 font-medium">
                      {log.returnedQty.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {log.soldQty.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-700">
                      {getAvailableStock(log.productId).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ৳{log.soldValue.toLocaleString()}
                    </td>
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
