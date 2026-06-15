import React, { useEffect, useState } from 'react';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
import {
  ChevronRight,
  Gift,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getTxMeta(tx) {
  const isSpent = tx.type === 'spent';
  const isCancelled = tx.status === 'cancelled';
  const isPending = tx.status === 'pending';

  if (isSpent) {
    return {
      icon: ArrowDownRight,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-50 border-rose-100',
      amountColor: 'text-rose-600',
      sign: '−',
      label: 'Оплата кешбэком',
    };
  }
  if (isCancelled) {
    return {
      icon: XCircle,
      iconColor: 'text-slate-400',
      bgColor: 'bg-slate-50 border-slate-100',
      amountColor: 'text-slate-400 line-through',
      sign: '',
      label: 'Отменено',
    };
  }
  if (isPending) {
    return {
      icon: Clock,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50 border-amber-100',
      amountColor: 'text-amber-600',
      sign: '+',
      label: 'Ожидает выполнения',
    };
  }
  // earned/available or manual/available
  return {
    icon: ArrowUpRight,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border-emerald-100',
    amountColor: 'text-emerald-600',
    sign: '+',
    label: tx.type === 'manual' ? 'Начислено' : 'Кешбэк зачислен',
  };
}

function StatCard({ label, value, sub, color = 'slate', icon: Icon }) {
  const colorClasses = {
    slate: {
      text: 'text-slate-900',
      iconBg: 'bg-slate-50 border-slate-100 text-slate-500',
    },
    emerald: {
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100/50 text-emerald-600',
    },
    amber: {
      text: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-100/50 text-amber-600',
    },
    rose: {
      text: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-100/50 text-rose-600',
    },
  };

  const current = colorClasses[color] || colorClasses.slate;

  return (
    <div className="group rounded-3xl bg-white border border-slate-200/60 p-5 sm:p-6 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200/20 to-transparent" />
      
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            {label}
          </span>
          <div className={`text-2xl sm:text-3xl font-black font-outfit tracking-tight ${current.text}`}>
            {value}
          </div>
        </div>
        
        {Icon && (
          <div className={`p-2.5 rounded-xl border shrink-0 transition-transform duration-300 group-hover:scale-110 ${current.iconBg}`}>
            <Icon className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
        )}
      </div>
      
      {sub && (
        <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100/80 pt-2 mt-1 leading-normal">
          {sub}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function CashbackPage({ customer, bonuses, onNavigate, onOpenAuth }) {
  const [filter, setFilter] = useState('all'); // all | earned | spent | pending
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  useEffect(() => {
    if (customer && bonuses) {
      bonuses.fetchSummary();
      bonuses.fetchHistory({ page: 1 });
    }
  }, [customer]);

  const filteredHistory = (bonuses?.history || []).filter((tx) => {
    if (filter === 'earned') return (tx.type === 'earned' || tx.type === 'manual') && tx.status !== 'cancelled';
    if (filter === 'spent') return tx.type === 'spent';
    if (filter === 'pending') return tx.status === 'pending';
    return true;
  });

  // ── Auth gate ──
  if (!customer) {
    return (
      <section className="mx-auto max-w-2xl py-20 px-4 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200 mx-auto">
          <Gift className="h-9 w-9" />
        </div>
        <div>
          <h1 className="font-outfit text-3xl font-black text-slate-950">Программа кешбэка</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Войдите в аккаунт, чтобы видеть свой кешбэк-баланс и историю начислений.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAuth}
          className="bg-slate-950 hover:bg-amber-500 text-white font-black px-8 py-3.5 rounded-xl transition-all text-sm uppercase tracking-wider shadow-sm active:scale-95"
        >
          Войти в аккаунт
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in-up">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans leading-relaxed">
        <Link
          href={getPageHref('home')}
          onClick={() => onNavigate?.('home')}
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
        >
          Главная
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <span className="text-slate-900 font-extrabold">Мой кешбэк</span>
      </nav>

      {/* Unified Loyalty & Cashback Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cashback Balance & Stats */}
        <div 
          className="lg:col-span-7 relative rounded-[2rem] overflow-hidden bg-[#0b1329] border border-slate-800/80 p-6 sm:p-8 flex flex-col justify-between shadow-xl min-h-[350px] text-white"
          style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          {/* Blueprint Crane Graphic */}
          <svg 
            className="absolute right-0 bottom-0 h-full w-auto text-blue-500/10 opacity-30 select-none pointer-events-none z-0" 
            viewBox="0 0 200 200" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.8"
          >
            {/* Crane tower */}
            <line x1="140" y1="200" x2="140" y2="30" />
            <line x1="146" y1="200" x2="146" y2="30" />
            {/* Diagonal trusses for tower */}
            <line x1="140" y1="180" x2="146" y2="165" />
            <line x1="146" y1="165" x2="140" y2="150" />
            <line x1="140" y1="150" x2="146" y2="135" />
            <line x1="146" y1="135" x2="140" y2="120" />
            <line x1="140" y1="120" x2="146" y2="105" />
            <line x1="146" y1="105" x2="140" y2="90" />
            <line x1="140" y1="90" x2="146" y2="75" />
            <line x1="146" y1="75" x2="140" y2="60" />
            <line x1="140" y1="60" x2="146" y2="45" />
            <line x1="146" y1="45" x2="140" y2="30" />
            {/* Crane jib (horizontal boom) */}
            <line x1="30" y1="30" x2="185" y2="30" />
            <line x1="140" y1="20" x2="140" y2="30" />
            {/* Jib trusses */}
            <line x1="140" y1="20" x2="90" y2="30" />
            <line x1="140" y1="20" x2="175" y2="30" />
            {/* Counterweight */}
            <rect x="160" y="30" width="12" height="12" fill="currentColor" fillOpacity="0.1" />
            {/* Trolley and hook */}
            <rect x="80" y="30" width="5" height="3" fill="currentColor" />
            <line x1="82.5" y1="33" x2="82.5" y2="85" />
            {/* Load hook */}
            <path d="M80.5,85 C80.5,89 84.5,89 84.5,85" />
          </svg>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Gift className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Баланс кешбэка
              </span>
            </div>
            
            <div className="space-y-1">
              <h1 className="font-outfit text-5xl font-black text-white tracking-tight">
                {formatPrice(bonuses?.availableBalance ?? 0)}
              </h1>
              <p className="text-xs font-bold text-slate-400">Доступно для оплаты новых покупок</p>
            </div>

            {(bonuses?.pendingBalance ?? 0) > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/25 rounded-xl px-3 py-1.5 text-[11px] font-bold text-blue-300">
                <Clock className="h-3.5 w-3.5" />
                +{formatPrice(bonuses.pendingBalance)} ожидает выполнения заказов
              </div>
            )}
 
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Всего заработано</span>
                <span className="text-sm sm:text-base font-black text-white font-outfit">{formatPrice(bonuses?.totalEarned ?? 0)}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Потрачено</span>
                <span className="text-sm sm:text-base font-black text-white font-outfit">{formatPrice(bonuses?.totalSpent ?? 0)}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">В ожидании</span>
                <span className="text-sm sm:text-base font-black text-white font-outfit">{formatPrice(bonuses?.pendingBalance ?? 0)}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/80 mt-6">
            <p className="text-[11px] text-slate-400 font-semibold leading-normal max-w-[280px]">
              Кешбэк {bonuses?.loyalty?.baseCashbackPercent ?? 3}% начисляется с каждого выполненного заказа и списывается при оплате новых.
            </p>
            <Link
              href={getPageHref('cart')}
              onClick={() => onNavigate?.('cart')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 backdrop-blur-md font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all active:scale-95 text-center inline-block shrink-0 cursor-pointer"
            >
              Перейти в корзину
            </Link>
          </div>
        </div>

        {/* Right Column: Loyalty Status & Progress */}
        {bonuses?.loyalty && (
          <div 
            className="lg:col-span-5 relative rounded-[2rem] overflow-hidden bg-[#0b1329] border border-slate-800/80 p-6 sm:p-8 flex flex-col justify-between shadow-xl min-h-[350px] text-white"
            style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
          >
            {/* Blueprint Building Structure Graphic - Unified blue blueprint style */}
            <svg 
              className="absolute right-0 bottom-0 h-full w-auto text-blue-500/10 opacity-40 select-none pointer-events-none z-0" 
              viewBox="0 0 200 200" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="0.8"
            >
              {/* Ground line */}
              <line x1="20" y1="180" x2="180" y2="180" />
              {/* Foundation markings */}
              <line x1="30" y1="185" x2="170" y2="185" strokeDasharray="3,3" />
              
              {/* Vertical Columns */}
              <line x1="50" y1="180" x2="50" y2="70" />
              <line x1="90" y1="180" x2="90" y2="70" />
              <line x1="130" y1="180" x2="130" y2="70" />
                           {/* Roof Truss Structure */}
              <line x1="50" y1="75" x2="90" y2="45" />
              <line x1="130" y1="75" x2="90" y2="45" />
              <line x1="90" y1="75" x2="90" y2="45" />
              <line x1="70" y1="60" x2="70" y2="75" />
              <line x1="110" y1="60" x2="110" y2="75" />
              
              {/* Dimension / Measurement Lines */}
              <line x1="35" y1="70" x2="35" y2="180" />
              <line x1="30" y1="70" x2="40" y2="70" />
              <line x1="30" y1="180" x2="40" y2="180" />
              
              <line x1="50" y1="35" x2="130" y2="35" />
              <line x1="50" y1="30" x2="50" y2="40" />
              <line x1="130" y1="30" x2="130" y2="40" />
            </svg>

            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6 relative z-10 font-sans">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ваш уровень лояльности</span>
                  <span className={`inline-block text-[10px] font-bold uppercase px-3 py-1 rounded-lg border tracking-wider ${
                    bonuses.loyalty.level === 'partner' 
                      ? 'bg-[#162235] text-[#7ea6e0] border-[#253954]' 
                      : bonuses.loyalty.level === 'resident' 
                      ? 'bg-[#162235] text-[#7ea6e0] border-[#253954]' 
                      : 'bg-[#162235] text-[#7ea6e0] border-[#253954]'
                  }`}>
                    {bonuses.loyalty.levelName}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Покупки за год</span>
                  <span className="text-sm sm:text-base font-black text-white font-outfit tracking-tight">{formatPrice(bonuses.loyalty.totalSpentThisYear)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 pt-2 text-left">
                <div className="flex justify-between text-xs font-bold text-slate-350">
                  {bonuses.loyalty.level === 'partner' ? (
                    <span className="text-slate-300 flex items-center gap-1.5 font-bold">Вы достигли максимального уровня</span>
                  ) : (
                    <span>До уровня {bonuses.loyalty.nextLevelName}</span>
                  )}
                  {bonuses.loyalty.level !== 'partner' && (
                    <span className="font-mono text-slate-300 text-xs bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/80">
                      Осталось: {formatPrice(bonuses.loyalty.neededToNextLevel)}
                    </span>
                  )}
                </div>
                <div className="w-full bg-[#080d1d] rounded-full h-2 border border-[#162235] p-0.5">
                  <div
                    className="h-1 rounded-full transition-all duration-700 ease-out bg-blue-500/70"
                    style={{ width: `${bonuses.loyalty.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-550 font-extrabold uppercase tracking-widest">
                  <span>Участник (0 ₸)</span>
                  <span>Резидент (500к ₸)</span>
                  <span>Партнёр (2м ₸)</span>
                </div>
              </div>
            </div>

            {/* Quick rates summary */}
            <div className="relative z-10 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center mt-6">
              <div className={`p-2.5 rounded-xl border transition-all ${
                bonuses.loyalty.level === 'participant'
                  ? 'bg-[#1a2638] border-[#2b3c54] text-white font-bold shadow-none' 
                  : 'bg-transparent border-[#162235] text-[#556987]'
              }`}>
                <p className="text-[9px] font-black uppercase tracking-wider">Участник</p>
                <p className="text-xs font-black mt-1">3% / 50%</p>
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${
                bonuses.loyalty.level === 'resident' 
                  ? 'bg-[#1a2638] border-[#2b3c54] text-white font-bold shadow-none' 
                  : 'bg-transparent border-[#162235] text-[#556987]'
              }`}>
                <p className="text-[9px] font-black uppercase tracking-wider">Резидент</p>
                <p className="text-xs font-black mt-1">4% / 75%</p>
              </div>
              <div className={`p-2.5 rounded-xl border transition-all ${
                bonuses.loyalty.level === 'partner' 
                  ? 'bg-[#1a2638] border-[#2b3c54] text-white font-bold shadow-none' 
                  : 'bg-transparent border-[#162235] text-[#556987]'
              }`}>
                <p className="text-[9px] font-black uppercase tracking-wider">Партнёр</p>
                <p className="text-xs font-black mt-1">5% / 100%</p>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Transaction history */}
      {/* Transaction history Preview */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Последние транзакции
          </h2>
          {(bonuses?.history || []).length > 0 && (
            <Link
              href={getPageHref('cashback/history')}
              onClick={() => onNavigate?.('cashback/history')}
              className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors"
            >
              Смотреть все
            </Link>
          )}
        </div>

        {/* Loading */}
        {bonuses?.historyLoading && (bonuses?.history || []).length === 0 && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm font-semibold">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Загружаем транзакции...
          </div>
        )}

        {/* Empty state */}
        {!bonuses?.historyLoading && (bonuses?.history || []).length === 0 && (
          <div className="py-12 text-center space-y-3">
            <ShoppingBag className="h-12 w-12 text-slate-200 mx-auto" />
            <p className="text-sm font-bold text-slate-400">Транзакций пока нет</p>
            <p className="text-xs text-slate-400">
              Оформите первый заказ и получите кешбэк 3%
            </p>
          </div>
        )}

        {/* Transactions list preview (up to 3 items) */}
        {(bonuses?.history || []).length > 0 && (
          <div className="divide-y divide-slate-100">
            {(bonuses.history.slice(0, 3)).map((tx) => {
              const meta = getTxMeta(tx);
              const Icon = meta.icon;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/40 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${meta.bgColor}`}>
                    <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {tx.description || meta.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('ru-RU', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {tx.orderId && (
                        <Link
                          href={getPageHref('order-detail', tx.orderId)}
                          onClick={() => onNavigate?.('order-detail', tx.orderId)}
                          className="text-[11px] font-black text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          Заказ #{tx.orderId}
                        </Link>
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.bgColor} ${meta.iconColor}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <span className={`font-black text-base shrink-0 ${meta.amountColor}`}>
                    {meta.sign}{formatPrice(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* FAQ Section */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Часто задаваемые вопросы по программе лояльности
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              q: "Как работает система начисления и списания кешбэка?",
              a: "Процесс состоит из 3 простых шагов: 1. Покупка (вы оформляете заказ, кешбэк начисляется на ваш баланс в статусе «Ожидает»); 2. Активация (когда статус заказа меняется на «Выполнен», бонусы переводятся в статус «Доступно»); 3. Оплата (при оформлении нового заказа вы можете оплатить накопленными бонусами часть стоимости прямо в корзине)."
            },
            {
              q: "Как происходит регистрация в системе привилегий?",
              a: "Регистрация происходит автоматически при создании учетной записи на сайте Tormag.kz. Никаких дополнительных действий предпринимать не требуется."
            },
            {
              q: "Какой уровень привилегий присваивается при регистрации?",
              a: "При регистрации каждому новому клиенту автоматически присваивается стартовый уровень «Участник», дающий право на базовый кешбэк 3% и списание бонусов до 50% от суммы заказа."
            },
            {
              q: "Через сколько времени обновляется уровень привилегий?",
              a: "Ваш уровень обновляется автоматически в режиме реального времени. Как только общая сумма выполненных (completed) заказов за текущий календарный год превысит 500 000 ₸, вам будет присвоен уровень «Резидент» (лимит списания 75%), а при превышении 2 000 000 ₸ — уровень «Партнёр» (лимит списания 100%)."
            },
            {
              q: "Что будет, если не достигнуть необходимой суммы покупок для поддержания уровня?",
              a: "Уровень привилегий рассчитывается заново в начале каждого календарного года на основе общей суммы ваших выполненных покупок за предыдущий год."
            },
            {
              q: "Какие покупки не учитываются в системе привилегий?",
              a: "В накоплениях для перехода на новые уровни не учитываются отмененные или возвращенные заказы. Также бонусы не начисляются на часть стоимости заказа, которая была оплачена другими бонусами."
            },
            {
              q: "Могу ли я передать свои привилегии или накопленный кешбэк другому человеку?",
              a: "Нет, привилегии и бонусный баланс привязаны к вашей индивидуальной учетной записи (номеру телефона и email) и не могут быть объединены с другими аккаунтами или переданы третьим лицам."
            }
          ].map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={idx} className="border-b border-slate-100 last:border-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:bg-slate-50/50 transition-colors gap-4"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{item.q}</span>
                  <ChevronRight className={`h-4 w-4 text-slate-400 shrink-0 transform transition-transform ${isOpen ? 'rotate-90 text-slate-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
