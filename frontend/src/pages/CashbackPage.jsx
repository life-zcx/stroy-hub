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

      {/* Hero Card */}
      <div className="relative rounded-[2rem] overflow-hidden bg-white border border-slate-200/80 p-8 sm:p-10 text-slate-800 shadow-sm">
        {/* Decorative blobs */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
                <Gift className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                Программа кешбэка
              </span>
            </div>
            <h1 className="font-outfit text-5xl font-black text-emerald-600">
              {formatPrice(bonuses?.availableBalance ?? 0)}
            </h1>
            <p className="text-sm font-semibold text-slate-500">Доступный кешбэк-баланс</p>
            {(bonuses?.pendingBalance ?? 0) > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5 text-[11px] font-bold text-amber-600">
                <Clock className="h-3.5 w-3.5" />
                +{formatPrice(bonuses.pendingBalance)} ожидает выполнения заказов
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 text-right">
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-[200px] text-left sm:text-right">
              Кешбэк 3% начисляется с каждого выполненного заказа и списывается при оплате новых.
            </p>
            <Link
              href={getPageHref('cart')}
              onClick={() => onNavigate?.('cart')}
              className="mt-1 self-start sm:self-end bg-slate-955 hover:bg-emerald-650 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md text-center inline-block"
            >
              Перейти в корзину
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Всего заработано"
          value={formatPrice(bonuses?.totalEarned ?? 0)}
          color="emerald"
          icon={TrendingUp}
        />
        <StatCard
          label="Потрачено"
          value={formatPrice(bonuses?.totalSpent ?? 0)}
          color="rose"
          icon={Percent}
        />
        <StatCard
          label="Ожидает"
          value={formatPrice(bonuses?.pendingBalance ?? 0)}
          sub="будет доступен после выполнения"
          color="amber"
          icon={Clock}
        />
        <StatCard
          label="Доступно"
          value={formatPrice(bonuses?.availableBalance ?? 0)}
          sub="можно потратить прямо сейчас"
          color="emerald"
          icon={CheckCircle2}
        />
      </div>

      {/* How it works banner */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden">
        {/* Soft decorative background glows */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="glossy-icon-shell glossy-icon-blue shrink-0 hidden md:flex">
          <Gift className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="space-y-3 relative z-10 w-full">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <span className="md:hidden">💡</span>
            Как работает кешбэк?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">1</span>
                <span className="text-xs font-extrabold text-slate-900">Покупка</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">
                Оформляете заказ — кешбэк 3% начисляется со статусом «Ожидает».
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black">2</span>
                <span className="text-xs font-extrabold text-slate-900">Активация</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">
                Когда заказ переходит в статус «Выполнен», кешбэк становится доступным.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black">3</span>
                <span className="text-xs font-extrabold text-slate-900">Оплата</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">
                При следующем заказе выбираете «Оплатить кешбэком» прямо в корзине.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            История транзакций
            {bonuses?.historyTotal > 0 && (
              <span className="bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 text-[10px] font-black">
                {bonuses.historyTotal}
              </span>
            )}
          </h2>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Все' },
              { id: 'earned', label: 'Начислено' },
              { id: 'spent', label: 'Списано' },
              { id: 'pending', label: 'Ожидание' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                  filter === f.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {bonuses?.historyLoading && (bonuses?.history || []).length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm font-semibold">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Загружаем историю...
          </div>
        )}

        {/* Empty state */}
        {!bonuses?.historyLoading && filteredHistory.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <ShoppingBag className="h-12 w-12 text-slate-200 mx-auto" />
            <p className="text-sm font-bold text-slate-400">Транзакций пока нет</p>
            <p className="text-xs text-slate-400">
              {filter === 'all'
                ? 'Оформите первый заказ и получите кешбэк 3%'
                : 'Нет транзакций в этой категории'}
            </p>
          </div>
        )}

        {/* Transactions list */}
        {filteredHistory.length > 0 && (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((tx) => {
              const meta = getTxMeta(tx);
              const Icon = meta.icon;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors"
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

        {/* Load more */}
        {bonuses?.historyHasMore && (
          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/60 text-center">
            <button
              type="button"
              onClick={bonuses.loadMoreHistory}
              disabled={bonuses.historyLoading}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
            >
              {bonuses.historyLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Загрузить ещё
            </button>
          </div>
        )}
      </div>

      {/* CTA — go to orders */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-sm font-black text-slate-900">Хотите больше кешбэка?</p>
          <p className="text-xs text-slate-500 mt-0.5">Чем больше заказов — тем выше накопленный баланс.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={getPageHref('orders')}
            onClick={() => onNavigate?.('orders')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all active:scale-95 text-center inline-block"
          >
            Мои заказы
          </Link>
          <Link
            href={getPageHref('catalog')}
            onClick={() => onNavigate?.('catalog')}
            className="bg-slate-950 hover:bg-emerald-650 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-center inline-block"
          >
            В каталог
          </Link>
        </div>
      </div>
    </section>
  );
}
