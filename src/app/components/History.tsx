import { useEffect, useMemo, useState } from 'react';
import { Download, Filter, History as HistoryIcon } from 'lucide-react';
import { storage } from '../utils/storage';
import { DailyOrder, DailyReturn, DailySale, MorningDispatch, Product } from '../types';

type LedgerType = 'all' | 'order' | 'dispatch' | 'sale' | 'return';

type LedgerRow = {
  id: string;
  date: string;
  type: LedgerType;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
};

export function History() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [dispatches, setDispatches] = useState<MorningDispatch[]>([]);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [returns, setReturns] = useState<DailyReturn[]>([]);
  const [typeFilter, setTypeFilter] = useState<LedgerType>('all');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      const data = await storage.getBootstrap();
      setProducts(data.products);
      setOrders(data.orders);
      setDispatches(data.dispatches);
      setSales(data.sales);
      setReturns(data.returns);
    };

    void loadHistory();
  }, []);

  const logs = useMemo<LedgerRow[]>(() => {
    const orderRows = orders.map((item) => ({
      id: item.id,
      date: item.date,
      type: 'order' as const,
      productId: item.productId,
      productName: products.find((product) => product.id === item.productId)?.name || 'Unknown',
      quantity: item.quantity,
      amount: item.quantity * (products.find((product) => product.id === item.productId)?.sellingPrice || 0),
    }));
    const dispatchRows = dispatches.map((item) => ({
      id: item.id,
      date: item.date,
      type: 'dispatch' as const,
      productId: item.productId,
      productName: products.find((product) => product.id === item.productId)?.name || 'Unknown',
      quantity: item.quantity,
      amount: item.quantity * (products.find((product) => product.id === item.productId)?.purchasePrice || 0),
    }));
    const saleRows = sales.map((item) => ({
      id: item.id,
      date: item.date,
      type: 'sale' as const,
      productId: item.productId,
      productName: products.find((product) => product.id === item.productId)?.name || 'Unknown',
      quantity: item.quantity,
      amount: item.amount,
    }));
    const returnRows = returns.map((item) => ({
      id: item.id,
      date: item.date,
      type: 'return' as const,
      productId: item.productId,
      productName: products.find((product) => product.id === item.productId)?.name || 'Unknown',
      quantity: item.quantity,
      amount: item.amount,
    }));

    return [...orderRows, ...dispatchRows, ...saleRows, ...returnRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [dispatches, orders, products, returns, sales]);

  const filteredLogs = logs.filter((log) => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    if (filterProduct && log.productId !== filterProduct) return false;
    if (filterDateFrom && log.date < filterDateFrom) return false;
    if (filterDateTo && log.date > filterDateTo) return false;
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Product', 'Quantity', 'Amount (৳)'];
    const rows = filteredLogs.map((log) => [log.date, log.type, log.productName, log.quantity, log.amount.toFixed(2)]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-white">Activity History</h1>
          <p className="text-slate-400">Search across orders, dispatches, sales, and returns.</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
          disabled={filteredLogs.length === 0}
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-3">
            <Filter className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Filters</h2>
            <p className="text-sm text-slate-400">Narrow records by product, type, or date range.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Type</label>
            <select title="Record type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LedgerType)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none">
              <option value="all">All</option>
              <option value="order">Orders</option>
              <option value="dispatch">Dispatches</option>
              <option value="sale">Sales</option>
              <option value="return">Returns</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Product</label>
            <select title="Filter by product" value={filterProduct} onChange={(event) => setFilterProduct(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none">
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">From</label>
            <input type="date" value={filterDateFrom} onChange={(event) => setFilterDateFrom(event.target.value)} title="From date" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">To</label>
            <input type="date" value={filterDateTo} onChange={(event) => setFilterDateTo(event.target.value)} title="To date" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3\">
        <SummaryCard label="Entries" value={filteredLogs.length} />
        <SummaryCard label="Total Quantity" value={filteredLogs.reduce((sum, item) => sum + item.quantity, 0)} />
        <SummaryCard label="Total Amount" value={`৳${filteredLogs.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}`} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20 backdrop-blur">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/15 p-3">
              <HistoryIcon className="w-6 h-6 text-orange-300" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Ledger</h2>
              <p className="text-sm text-slate-400">{filteredLogs.length} records found</p>
            </div>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="py-12 text-center text-slate-400">No records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-white/5 text-left text-sm text-slate-400">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.type + log.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-slate-300">{log.date}</td>
                    <td className="py-3 px-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeBadgeClass(log.type)}`}>{log.type}</span>
                    </td>
                    <td className="py-3 px-4 text-white">{log.productName}</td>
                    <td className="py-3 px-4 text-right text-white">{log.quantity.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-white">৳{log.amount.toLocaleString()}</td>
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

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function typeBadgeClass(type: LedgerType) {
  switch (type) {
    case 'order':
      return 'bg-cyan-500/15 text-cyan-300';
    case 'dispatch':
      return 'bg-amber-500/15 text-amber-300';
    case 'sale':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'return':
      return 'bg-rose-500/15 text-rose-300';
    default:
      return 'bg-white/10 text-slate-200';
  }
}
