import React, { useEffect, useState } from 'react';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
import {
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

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
  return {
    icon: ArrowUpRight,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border-emerald-100',
    amountColor: 'text-emerald-600',
    sign: '+',
    label: tx.type === 'manual' ? 'Начислено' : 'Кешбэк зачислен',
  };
}

export default function TransactionsHistoryPage({ customer, bonuses, onNavigate, onOpenAuth }) {
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (customer && bonuses) {
      bonuses.fetchHistory({ page: 1 });
    }
  }, [customer]);

  const filteredHistory = (bonuses?.history || []).filter((tx) => {
    if (filter === 'earned') return (tx.type === 'earned' || tx.type === 'manual') && tx.status !== 'cancelled';
    if (filter === 'spent') return tx.type === 'spent';
    if (filter === 'pending') return tx.status === 'pending';
    return true;
  });

  if (!customer) {
    return (
      <section className="mx-auto max-w-2xl py-20 px-4 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 mx-auto">
          <TrendingUp className="h-9 w-9" />
        </div>
        <div>
          <h1 className="font-outfit text-3xl font-black text-slate-950">История транзакций</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Войдите в аккаунт, чтобы просматривать историю изменений вашего бонусного баланса.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAuth}
          className="bg-slate-950 hover:bg-emerald-650 text-white font-black px-8 py-3.5 rounded-xl transition-all text-sm uppercase tracking-wider shadow-sm active:scale-95"
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
        <Link
          href={getPageHref('cashback')}
          onClick={() => onNavigate?.('cashback')}
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
        >
          Мой кешбэк
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <span className="text-slate-900 font-extrabold">История транзакций</span>
      </nav>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-black text-slate-950 tracking-tight">История транзакций</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Детализация начислений и списаний бонусов</p>
        </div>
        
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
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
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === f.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Container */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Loading state */}
        {bonuses?.historyLoading && (bonuses?.history || []).length === 0 && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm font-semibold">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Загружаем историю транзакций...
          </div>
        )}

        {/* Empty state */}
        {!bonuses?.historyLoading && filteredHistory.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Транзакций пока нет</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {filter === 'all'
                  ? 'Оформите первый заказ и получите кешбэк за покупки'
                  : 'В выбранной категории транзакции отсутствуют'}
              </p>
            </div>
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
                  className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50/40 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${meta.bgColor}`}>
                    <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {tx.description || meta.label}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <p className="text-[11px] text-slate-400 font-medium">
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
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.bgColor} ${meta.iconColor}`}>
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
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-650 hover:text-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {bonuses.historyLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Показать ещё транзакции
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
