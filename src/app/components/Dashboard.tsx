import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Package,
  PackageSearch,
  TrendingDown,
  Truck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { storage } from '../utils/storage';
import { DailyOrder, DailyReturn, DailySale, MorningDispatch, Product } from '../types';

const STATUS_COLORS = ['#34d399', '#fbbf24', '#fb7185'];

export function Dashboard() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { products, orders, sales, dispatches, returns } = useMemo(() => {
    return {
      products: storage.getProducts(),
      orders: storage.getOrders(),
      sales: storage.getSales(),
      dispatches: storage.getDispatches(),
      returns: storage.getReturns(),
    };
  }, [month]);

  const today = new Date().toISOString().split('T')[0];

  const todaySales = sales.filter((item) => item.date === today);
  const todayDispatches = dispatches.filter((item) => item.date === today);
  const todayReturns = returns.filter((item) => item.date === today);

  const todayDispatchQty = todayDispatches.reduce((sum, item) => sum + item.quantity, 0);
  const todayReturnQty = todayReturns.reduce((sum, item) => sum + item.quantity, 0);
  const todayNetMovement = todayDispatchQty - todayReturnQty;

  const monthOrders = orders.filter((item) => item.date.startsWith(month));
  const monthSales = sales.filter((item) => item.date.startsWith(month));
  const monthDispatches = dispatches.filter((item) => item.date.startsWith(month));
  const monthReturns = returns.filter((item) => item.date.startsWith(month));

  const totalStock = products.reduce((sum, product) => sum + product.currentStock, 0);
  const totalStockValue = products.reduce((sum, product) => sum + product.currentStock * product.purchasePrice, 0);
  const totalPurchaseValue = products.reduce((sum, product) => sum + product.totalQuantity * product.purchasePrice, 0);

  const todaySalesAmount = todaySales.reduce((sum, item) => sum + item.amount, 0);
  const todayReturnsAmount = todayReturns.reduce((sum, item) => sum + item.amount, 0);
  const todayNetSalesAmount = todaySalesAmount - todayReturnsAmount;

  const monthSalesAmount = monthSales.reduce((sum, item) => sum + item.amount, 0);
  const monthReturnsAmount = monthReturns.reduce((sum, item) => sum + item.amount, 0);
  const monthNetSalesAmount = monthSalesAmount - monthReturnsAmount;

  const profitLoss = products.reduce((sum, product) => {
    const soldQty = monthSales.filter((sale) => sale.productId === product.id).reduce((total, sale) => total + sale.quantity, 0);
    const returnedQty = monthReturns.filter((entry) => entry.productId === product.id).reduce((total, entry) => total + entry.quantity, 0);
    const netSoldQty = Math.max(0, soldQty - returnedQty);
    return sum + netSoldQty * (product.sellingPrice - product.purchasePrice);
  }, 0);

  const dailyChartData = buildDailyChartData(monthSales, monthReturns);
  const stockStatusData = buildStockStatusData(products);
  const topProducts = buildTopProducts(products, monthSales, monthReturns);
  const lowStockProducts = products.filter((product) => product.currentStock <= product.lowStockThreshold);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold text-white">Daily Summary Dashboard</h1>
            <p className="max-w-2xl text-slate-400">Track stock, dispatch, sales, returns, and profitability from one offline-ready view.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Analytics Month</p>
            <input
              type="text"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              placeholder="YYYY-MM"
              title="Analytics month in YYYY-MM format"
              className="mt-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={<Package className="w-6 h-6 text-cyan-300" />} label="Remaining Stock" value={totalStock.toLocaleString()} subValue={`Stock value ৳${totalStockValue.toLocaleString()}`} />
        <StatCard icon={<Truck className="w-6 h-6 text-emerald-300" />} label="Total Dispatch" value={todayDispatches.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} subValue={`Entries: ${todayDispatches.length}`} />
        <StatCard icon={<TrendingDown className="w-6 h-6 text-orange-300" />} label="Today Returns" value={todayReturns.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} subValue={`৳${todayReturnsAmount.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard title="Net Sales" value={`৳${todayNetSalesAmount.toLocaleString()}`} accent="from-fuchsia-500/20 to-fuchsia-500/5" icon={<DollarSign className="w-5 h-5 text-fuchsia-300" />} />
        <MetricCard title="Month Profit / Loss" value={`৳${profitLoss.toLocaleString()}`} accent="from-emerald-500/20 to-emerald-500/5" icon={<BarChart3 className="w-5 h-5 text-emerald-300" />} />
        <MetricCard title="Purchases vs Sales" value={`৳${totalPurchaseValue.toLocaleString()} / ৳${monthNetSalesAmount.toLocaleString()}`} accent="from-cyan-500/20 to-cyan-500/5" icon={<PackageSearch className="w-5 h-5 text-cyan-300" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Sales vs Returns" subtitle="Daily trend for the selected month">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="sales" name="Sales" stroke="#34d399" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="returns" name="Returns" stroke="#fb7185" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory Health" subtitle="Stock status distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {stockStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top Selling Products" subtitle="Net sold quantity this month">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Bar dataKey="value" fill="#60a5fa" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Today's Workflow" subtitle="Dispatch, returns, and stock movement at a glance">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MiniMetric label="Dispatch" value={todayDispatchQty} />
            <MiniMetric label="Returns" value={todayReturnQty} />
            <MiniMetric label="Net Movement" value={todayNetMovement} />
            <MiniMetric label="Sales Qty" value={todaySales.reduce((sum, item) => sum + item.quantity, 0)} />
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
            Dispatch moves stock out, returns bring inventory back, and net movement shows the day&apos;s stock flow.
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Low Stock Alerts</h2>
              <p className="text-sm text-slate-400">Products at or below threshold</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-300" />
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-slate-400">No inventory alerts right now.</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-amber-100/70">Threshold: {product.lowStockThreshold}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-100">{product.currentStock} left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Stock Status Breakdown</h2>
              <p className="text-sm text-slate-400">Quick view of your inventory health</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stockStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                {stockStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="mb-4 text-xl font-semibold text-white">Products</h2>
        {products.length === 0 ? (
          <p className="py-8 text-center text-slate-400">No products yet. Add your first product to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Purchase</th>
                  <th className="py-3 px-4 text-right">Selling</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Status</th>
                  <th className="py-3 px-4 text-right">Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-slate-500">Profit / unit ৳{(product.sellingPrice - product.purchasePrice).toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">৳{product.purchasePrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">৳{product.sellingPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-white">{product.currentStock.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">৳{(product.currentStock * product.purchasePrice).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="mb-1 text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
          {subValue && <p className="mt-1 text-sm text-slate-500">{subValue}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">{icon}</div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, accent, icon }: { title: string; value: string; accent: string; icon: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${accent} p-6 shadow-xl shadow-black/20`}>
      <div className="flex items-center gap-3 text-white/90">
        <div className="rounded-xl border border-white/10 bg-white/10 p-2">{icon}</div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value.toLocaleString()}</p>
    </div>
  );
}

function buildDailyChartData(sales: DailySale[], returns: DailyReturn[]) {
  const dates = new Set([...sales.map((item) => item.date), ...returns.map((item) => item.date)]);
  return [...dates]
    .sort()
    .map((date) => ({
      date: date.slice(8),
      sales: sales.filter((item) => item.date === date).reduce((sum, item) => sum + item.amount, 0),
      returns: returns.filter((item) => item.date === date).reduce((sum, item) => sum + item.amount, 0),
    }));
}

function buildStockStatusData(products: Product[]) {
  const counts = products.reduce(
    (acc, product) => {
      if (product.currentStock === 0) acc.out += 1;
      else if (product.currentStock <= product.lowStockThreshold) acc.low += 1;
      else acc.healthy += 1;
      return acc;
    },
    { healthy: 0, low: 0, out: 0 },
  );

  return [
    { name: 'In stock', value: counts.healthy },
    { name: 'Low stock', value: counts.low },
    { name: 'Out of stock', value: counts.out },
  ];
}

function buildTopProducts(products: Product[], sales: DailySale[], returns: DailyReturn[]) {
  return products
    .map((product) => {
      const soldQty = sales.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
      const returnedQty = returns.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
      return {
        name: product.name,
        value: Math.max(0, soldQty - returnedQty),
      };
    })
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function getStockStatus(product: Product) {
  if (product.currentStock === 0) {
    return { label: 'Out of stock', className: 'bg-rose-500/15 text-rose-300' };
  }
  if (product.currentStock <= product.lowStockThreshold) {
    return { label: 'Low stock', className: 'bg-amber-500/15 text-amber-300' };
  }
  return { label: 'In stock', className: 'bg-emerald-500/15 text-emerald-300' };
}
