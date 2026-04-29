import { useEffect, useState } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import { storage } from '../utils/storage';
import { DailyLog, Product } from '../types';

export function EveningReturn() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnsMap, setReturnsMap] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData(date);
  }, [date]);

  const loadData = (selectedDate: string) => {
    const allProducts = storage.getProducts();
    const dayLogs = storage
      .getLogs()
      .filter(log => log.date.startsWith(selectedDate))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    setProducts(allProducts);
    setLogs(dayLogs);

    const nextMap: Record<string, number> = {};
    dayLogs.forEach(log => {
      nextMap[log.id] = log.returnedQty;
    });
    setReturnsMap(nextMap);
  };

  const handleSaveReturns = () => {
    setErrorMessage('');

    for (const log of logs) {
      const returnedQty = Number(returnsMap[log.id] ?? 0);
      if (returnedQty < 0) {
        setErrorMessage('Returned quantity cannot be negative.');
        return;
      }
      if (returnedQty > log.orderedQty) {
        setErrorMessage(`Returned quantity cannot be greater than ordered quantity for ${getProductName(log.productId)}.`);
        return;
      }
    }

    logs.forEach(log => {
      const returnedQty = Number(returnsMap[log.id] ?? 0);
      storage.updateLogReturnedQuantity(log.id, returnedQty);
    });

    loadData(date);
    setSuccessMessage('Evening returns updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getProductName = (productId: string) => {
    const product = products.find(item => item.id === productId);
    if (!product) return 'Unknown Product';
    return `${product.name}${product.sizeUnit ? ` (${product.sizeUnit})` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Evening Returns</h1>
        <p className="text-gray-600">Record returned quantities after evening count</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold">Select Date</h2>
            <p className="text-sm text-gray-600">Choose a date to update returns</p>
          </div>
        </div>

        <div className="max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <RotateCcw className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold">Returned Quantity (Evening)</h2>
            <p className="text-sm text-gray-600">Set returned quantities for each morning entry</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No morning entries found for selected date</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Product</p>
                    <p className="font-medium">{getProductName(log.productId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ordered (Morning)</p>
                    <p className="font-medium">{log.orderedQty.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Returned (Evening)</label>
                    <input
                      type="number"
                      min={0}
                      max={log.orderedQty}
                      value={returnsMap[log.id] ?? 0}
                      onChange={(event) => {
                        setReturnsMap(prev => ({
                          ...prev,
                          [log.id]: Number(event.target.value),
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Sold (Auto)</p>
                    <p className="font-semibold text-green-700">
                      {Math.max(0, log.orderedQty - Number(returnsMap[log.id] ?? 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleSaveReturns}
              className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Save Evening Returns
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Available Stock by Product</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between bg-white rounded px-3 py-2">
              <span className="text-gray-700">{product.name}{product.sizeUnit ? ` (${product.sizeUnit})` : ''}</span>
              <span className="font-semibold">{product.currentStock.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
