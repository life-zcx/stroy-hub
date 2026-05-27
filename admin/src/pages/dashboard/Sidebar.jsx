import {
  FileSpreadsheet as FileSpreadsheetIcon,
  BadgeCheck as BadgeCheckIcon,
  Layers as LayersIcon,
  Package as PackageIcon,
  PhoneCall as PhoneCallIcon,
  TicketPercent as TicketPercentIcon,
  ShieldAlert as ShieldAlertIcon,
  UserCheck as UserCheckIcon,
  Handshake,
  Hammer,
  RefreshCw,
  LogOut,
  ChevronRight,
  TrendingUp,
  Truck,
  BarChart3
} from 'lucide-react';

const tabIcons = {
  products: PackageIcon,
  orders: FileSpreadsheetIcon,
  pricing: TrendingUp,
  logistics: Truck,
  analytics: BarChart3,
  callbacks: PhoneCallIcon,
  promotions: TicketPercentIcon,
  brands: BadgeCheckIcon,
  categories: LayersIcon,
  suppliers: UserCheckIcon,
  users: ShieldAlertIcon,
  partners: Handshake,
};

const tabLabels = {
  products: 'Товары',
  orders: 'Заказы',
  pricing: 'Ценообразование и Маржа',
  logistics: 'Логистика и Маршруты',
  analytics: 'Аналитика и Отчеты',
  callbacks: 'Обратные звонки',
  promotions: 'Акции и скидки',
  brands: 'Бренды-партнеры',
  categories: 'Категории',
  suppliers: 'Дистрибьюторы',
  users: 'Пользователи',
  partners: 'Партнеры',
};

export default function Sidebar({ activePage, onPageChange, pages, counts, user, onLogout, onReload, loading }) {
  return (
    <aside className="w-72 bg-slate-900 h-screen flex flex-col fixed left-0 top-0 z-50 text-slate-300 transition-all duration-300 border-r border-slate-800">
      {/* Sidebar Header: Logo */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-600/20">
            <Hammer className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-white font-outfit uppercase">
              Stroy-<span className="text-emerald-500">Hub</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Control Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-grow px-4 space-y-1 overflow-y-auto hide-scrollbar">
        <p className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 mt-4">Навигация</p>
        {pages.map((page) => {
          const Icon = tabIcons[page];
          const isActive = activePage === page;
          const count = counts[page] ?? 0;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'} transition-colors`} />
                <span>{tabLabels[page]}</span>
              </div>
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Bottom: User & Actions */}
      <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/50">
        <div className="bg-slate-800/40 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-emerald-400 font-bold border border-slate-600/50 uppercase">
              {user.name?.[0] || 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{user.role}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onReload}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-black transition-all disabled:opacity-50"
              title="Синхронизировать данные"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              SYNC
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-[10px] font-black transition-all"
            >
              <LogOut className="h-3 w-3" />
              ВЫЙТИ
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
