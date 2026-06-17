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
  Gift,
  Shield
} from 'lucide-react';

const tabIcons = {
  products: PackageIcon,
  orders: BadgeCheckIcon,
  pricing: TrendingUp,
  analytics: BarChart3,
  promotions: TicketPercentIcon,
  'review-promos': Gift,
  brands: Handshake,
  reviews: MessageSquare,
  callbacks: PhoneCallIcon,
  partners: ShieldAlertIcon,
  categories: LayersIcon,
  suppliers: UserCheckIcon,
  users: UserCheckIcon,
  cashback: Gift,
  returns: RefreshCw,
  'warranty-rules': Shield,
};

const tabLabels = {
  products: 'Товары',
  orders: 'Заказы',
  pricing: 'Ценообразование и Маржа',
  analytics: 'Аналитика и Отчеты',
  callbacks: 'Обратные звонки',
  promotions: 'Акции и скидки',
  'review-promos': 'Промокоды',
  brands: 'Бренды-партнеры',
  reviews: 'Отзывы',
  partners: 'Партнеры',
  categories: 'Категории',
  suppliers: 'Дистрибьюторы',
  users: 'Пользователи',
  cashback: 'Кешбэк',
  returns: 'Возвраты',
  'warranty-rules': 'Правила гарантии',
};

export default function Sidebar({ activePage, onPageChange, pages, counts, user, onLogout, onReload, loading, isOpen, onClose, isCollapsed }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}
      <aside className={`bg-slate-900 h-screen flex flex-col fixed left-0 top-0 z-50 text-slate-300 transition-all duration-300 border-r border-slate-800 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-72 lg:w-16' : 'w-72'}`}>

        {/* Navigation Groups */}
        <nav className="flex-grow px-2 lg:px-3 space-y-1 overflow-y-auto hide-scrollbar py-2">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 mt-2">Навигация</p>
          )}
          {pages.filter(page => page !== 'user-portrait').map((page) => {
            const Icon = tabIcons[page];
            const isActive = activePage === page;
            const count = counts[page] ?? 0;

            return (
              <button
                key={page}
                onClick={() => {
                  onPageChange(page);
                  onClose?.();
                }}
                title={isCollapsed ? tabLabels[page] : undefined}
                className={`w-full flex items-center py-2.5 rounded-xl text-sm font-bold text-left transition-all group relative ${
                  isCollapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 stroke-[2.5] ${isCollapsed ? 'lg:mr-0 mr-3' : 'mr-3'} ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'} transition-colors shrink-0`} />
                {!isCollapsed && (
                  <span className="leading-tight text-left flex-1 truncate">{tabLabels[page]}</span>
                )}
                {count > 0 && (
                  <>
                    {!isCollapsed ? (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ml-auto shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'
                      }`}>
                        {count}
                      </span>
                    ) : (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border border-slate-900 rounded-full lg:block hidden animate-pulse" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
