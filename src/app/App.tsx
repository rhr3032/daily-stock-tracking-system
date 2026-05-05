import { useState } from 'react';
import { LayoutDashboard, Package, History, Menu, X, RotateCcw, Truck } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { AddProduct } from './components/AddProduct';
import { EveningReturn } from './components/EveningReturn';
import { History as HistoryPage } from './components/History';
import { MorningDispatch } from './components/MorningDispatch';

type Page = 'dashboard' | 'products' | 'dispatch' | 'returns' | 'history';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard' as Page, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as Page, name: 'Add Product', icon: Package },
    { id: 'dispatch' as Page, name: 'Morning Dispatch', icon: Truck },
    { id: 'returns' as Page, name: 'Evening Returns', icon: RotateCcw },
    { id: 'history' as Page, name: 'History', icon: History },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <AddProduct onSuccess={() => setCurrentPage('dashboard')} />;
      case 'dispatch':
        return <MorningDispatch />;
      case 'returns':
        return <EveningReturn />;
      case 'history':
        return <HistoryPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 lg:flex">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col border-r border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <div className="bg-gradient-to-br from-cyan-400 to-emerald-500 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Stock Manager</h1>
            <p className="text-xs text-slate-400">Inventory, dispatch, sales, and returns</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                  currentPage === item.id
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-400 to-emerald-500 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Stock Manager</h1>
                <p className="text-xs text-slate-400">Inventory, dispatch, sales, and returns</p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/5"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      currentPage === item.id
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <main className="flex-1 px-3 py-6 sm:px-4 md:px-6 lg:px-8">
          <div className="mx-auto w-full">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}