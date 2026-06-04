import logoImg from '../../tormag.png';
import {
  FileSpreadsheet as FileSpreadsheetIcon,
  BadgeCheck as BadgeCheckIcon,
  Layers as LayersIcon,
  Package as PackageIcon,
  PhoneCall as PhoneCallIcon,
  TicketPercent as TicketPercentIcon,
  ShieldAlert as ShieldAlertIcon,
  UserCheck as UserCheckIcon,
  MessageSquare,
  Handshake,
  Hammer,
  RefreshCw,
  LogOut,
  ChevronRight,
  TrendingUp,
  Truck,
  BarChart3,
  Globe2,
  Gift
} from 'lucide-react';

const tabIcons = {
  products: PackageIcon,
  orders: BadgeCheckIcon,
  pricing: TrendingUp,
  logistics: Truck,
  analytics: BarChart3,
  'site-analytics': Globe2,
  promotions: TicketPercentIcon,
  'review-promos': Gift,
  brands: Handshake,
  reviews: MessageSquare,
  callbacks: PhoneCallIcon,
  partners: ShieldAlertIcon,
  categories: LayersIcon,
  suppliers: UserCheckIcon,
  users: UserCheckIcon,
};

const tabLabels = {
  products: 'Товары',
  orders: 'Заказы',
  pricing: 'Ценообразование и Маржа',
  logistics: 'Логистика и Маршруты',
  analytics: 'Аналитика и Отчеты',
  'site-analytics': 'Посещаемость сайта',
  callbacks: 'Обратные звонки',
  promotions: 'Акции и скидки',
  'review-promos': 'Промокоды за отзывы',
  brands: 'Бренды-партнеры',
  reviews: 'Отзывы',
  partners: 'Партнеры',
  categories: 'Категории',
  suppliers: 'Дистрибьюторы',
  users: 'Пользователи',
};

export default function Sidebar({ activePage, onPageChange, pages, counts, user, onLogout, onReload, loading }) {
  return (
    <aside className="w-72 bg-slate-900 h-screen flex flex-col fixed left-0 top-0 z-50 text-slate-300 transition-all duration-300 border-r border-slate-800">
      
      {/* Sidebar Header: Logo & Role */}
      <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex items-center justify-start min-w-0 flex-1 overflow-hidden">
          <img src={logoImg} alt="TORMAG.KZ Logo" className="h-[140px] -my-10 -ml-10 w-auto max-w-none object-contain brightness-0 invert" />
        </div>
        <div className="h-6 w-px bg-slate-800/60 shrink-0" />
        <span className="text-[10px] font-black tracking-[0.15em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-outfit shrink-0">
          Admin
        </span>
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
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold text-left transition-all group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 stroke-[2.5] mr-3 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'} transition-colors shrink-0`} />
              <span className="leading-tight text-left flex-1">{tabLabels[page]}</span>
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ml-auto shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Bottom: Compact Copyright */}
      <div className="p-6 mt-auto border-t border-slate-800/60 text-center shrink-0">
        <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest">
          © 2026 TORMAG.KZ
        </span>
      </div>

    </aside>
  );
}
