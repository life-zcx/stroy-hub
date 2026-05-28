import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Globe2,
  Laptop,
  Link,
  MapPin,
  MousePointer2,
  RefreshCw,
  Smartphone,
  ShoppingCart,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getSiteAnalytics } from '../../../services/api';

const RANGE_LABELS = {
  day: 'Сегодня',
  week: '7 дней',
  month: '30 дней',
  all: 'Все время',
};

function getMaxValue(items, key = 'views') {
  return Math.max(1, ...items.map((item) => item[key] || 0));
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function KpiCard({ icon: Icon, label, value, caption, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-left">
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
        <div className={`rounded-xl border p-2.5 ${tones[tone] || tones.slate}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="font-outfit text-3xl font-black text-slate-950">{value}</p>
      {caption && <p className="mt-1 text-xs font-semibold text-slate-400">{caption}</p>}
    </div>
  );
}

function HorizontalBars({ items, labelKey, valueKey = 'views', emptyText }) {
  const max = getMaxValue(items, valueKey);

  if (!items.length) {
    return <p className="text-xs font-semibold text-slate-400">{emptyText || 'Данных пока нет.'}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const value = item[valueKey] || 0;
        return (
          <div key={item[labelKey]} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-bold text-slate-700" title={item[labelKey]}>{item[labelKey]}</span>
              <span className="font-black text-slate-950">{value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(value || 0);
}

export default function SiteAnalyticsPage({ showToast }) {
  const [range, setRange] = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getSiteAnalytics(range);
      setAnalytics(data);
    } catch (error) {
      console.error(error);
      showToast?.('Ошибка загрузки посещаемости сайта');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  const dateSeries = analytics?.viewsByDate || [];
  const maxDailyViews = getMaxValue(dateSeries, 'views');
  const peakHour = useMemo(() => {
    const hours = analytics?.peakHours || [];
    return hours.reduce((best, item) => (item.views > best.views ? item : best), { hour: 0, views: 0 });
  }, [analytics]);

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-32 text-slate-400">
        <RefreshCw className="mb-4 h-10 w-10 animate-spin text-blue-500" />
        <p className="text-xs font-black uppercase tracking-widest">Загружаем аналитику посещений...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 text-left animate-fade-in-up">
      <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
            <BarChart3 className="h-3.5 w-3.5" /> Web Analytics
          </div>
          <h2 className="font-outfit text-3xl font-black text-slate-950">Посещаемость сайта</h2>
          <p className="mt-2 max-w-2xl text-xs font-medium leading-5 text-slate-500">
            Подробная статистика просмотров, источников трафика, устройств, браузеров и популярных страниц.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
          {Object.entries(RANGE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                range === key ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Eye} label="Просмотры" value={analytics?.totalViews || 0} caption="За выбранный период" tone="blue" />
        <KpiCard icon={Users} label="Уникальные" value={analytics?.uniqueVisitors || 0} caption="По sessionId" tone="emerald" />
        <KpiCard icon={MousePointer2} label="Сегодня" value={analytics?.todayViews || 0} caption="Просмотры за день" tone="indigo" />
        <KpiCard icon={Activity} label="Глубина" value={analytics?.avgViewsPerSession || 0} caption="Страниц за сессию" tone="amber" />
        <KpiCard icon={TrendingUp} label="Bounce rate" value={`${analytics?.bounceRate || 0}%`} caption="Сессии с 1 страницей" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Воронка продаж</h3>
            <p className="mt-1 text-[11px] font-semibold text-slate-400">Путь клиента от посещения до оформленного заказа</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 border border-emerald-100">
            Выручка: {formatPrice(analytics?.orderRevenue || 0)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {(analytics?.funnel || []).map((step, index) => {
            const icons = [Eye, Activity, ShoppingCart, CreditCard, CheckCircle2];
            const Icon = icons[index] || Activity;
            const max = Math.max(1, analytics?.funnel?.[0]?.count || 0);
            return (
              <div key={step.key} className="relative rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  {index > 0 && <span className="text-[10px] font-black text-slate-400">{step.conversion}%</span>}
                </div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{step.label}</p>
                <p className="mt-1 font-outfit text-2xl font-black text-slate-950">{step.count}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${Math.max(4, (step.count / max) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Динамика просмотров</h3>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">Просмотры и уникальные сессии по дням</p>
            </div>
            <RefreshCw className={`h-4 w-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
          </div>

          {dateSeries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-xs font-bold text-slate-400">Данных пока нет.</div>
          ) : (
            <div className="flex h-72 items-end gap-2 rounded-2xl bg-slate-50 p-4">
              {dateSeries.map((item) => (
                <div key={item.date} className="flex h-full flex-1 flex-col justify-end gap-2 min-w-[28px]">
                  <div className="flex flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[34px] rounded-t-xl bg-gradient-to-t from-blue-600 to-emerald-400 shadow-sm"
                      title={`${item.date}: ${item.views} просмотров, ${item.visitors} посетителей`}
                      style={{ height: `${Math.max(6, (item.views / maxDailyViews) * 100)}%` }}
                    />
                  </div>
                  <span className="truncate text-center text-[9px] font-bold text-slate-400">{formatDate(item.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-slate-950">Активность по часам</h3>
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs font-black text-slate-900">Пиковый час: {String(peakHour.hour).padStart(2, '0')}:00</p>
                  <p className="text-[11px] font-semibold text-slate-400">{peakHour.views} просмотров</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {(analytics?.peakHours || []).map((item) => {
                const maxHour = getMaxValue(analytics?.peakHours || [], 'views');
                return (
                  <div key={item.hour} className="rounded-lg bg-slate-50 p-1.5 text-center" title={`${item.hour}:00 - ${item.views}`}>
                    <div className="mx-auto mb-1 h-10 w-2 overflow-hidden rounded-full bg-slate-200 flex items-end">
                      <div className="w-full rounded-full bg-blue-500" style={{ height: `${Math.max(4, (item.views / maxHour) * 100)}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">{item.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Globe2 className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Источники трафика</h3>
          </div>
          <HorizontalBars items={analytics?.topReferrers || []} labelKey="source" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Smartphone className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Устройства</h3>
          </div>
          <HorizontalBars items={analytics?.devices || []} labelKey="device" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Laptop className="h-4.5 w-4.5 text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Браузеры</h3>
          </div>
          <HorizontalBars items={analytics?.browsers || []} labelKey="browser" />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-4.5 w-4.5 text-rose-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Регионы</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">По выбранному региону на сайте</span>
        </div>

        {(analytics?.regions || []).length === 0 ? (
          <p className="text-xs font-semibold text-slate-400">Данных по регионам пока нет.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">Регион</th>
                  <th className="py-3 px-4 text-right">Просмотры</th>
                  <th className="py-3 px-4 text-right">Товары</th>
                  <th className="py-3 px-4 text-right">Корзины</th>
                  <th className="py-3 px-4 text-right">Заказы</th>
                  <th className="py-3 px-4 text-right">Конверсия</th>
                  <th className="py-3 pl-4 text-right">Выручка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.regions.map((region) => (
                  <tr key={region.region} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 font-black text-slate-900">{region.region}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">{region.views}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">{region.productViews}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">{region.cartAdds}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-950">{region.orders}</td>
                    <td className="py-3 px-4 text-right font-black text-blue-600">{region.conversion}%</td>
                    <td className="py-3 pl-4 text-right font-black text-emerald-600">{formatPrice(region.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Eye className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Товары по просмотрам</h3>
          </div>
          <HorizontalBars items={analytics?.topViewedProducts || []} labelKey="name" valueKey="views" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <ShoppingCart className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Товары в корзину</h3>
          </div>
          <HorizontalBars items={analytics?.topCartProducts || []} labelKey="name" valueKey="cartAdds" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Search className="h-4.5 w-4.5 text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Поисковые запросы</h3>
          </div>
          <HorizontalBars items={analytics?.topSearches || []} labelKey="query" valueKey="count" />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Выручка по источникам</h3>
        </div>
        {(analytics?.sourceRevenue || []).length === 0 ? (
          <p className="text-xs font-semibold text-slate-400">Данных по заказам пока нет.</p>
        ) : (
          <div className="space-y-4">
            {analytics.sourceRevenue.map((item) => {
              const max = getMaxValue(analytics.sourceRevenue, 'revenue');
              return (
                <div key={item.source} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-bold text-slate-700" title={item.source}>{item.source}</span>
                    <span className="font-black text-slate-950">{formatPrice(item.revenue)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${Math.max(4, (item.revenue / max) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Link className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Популярные страницы</h3>
          </div>
          <HorizontalBars items={analytics?.topPages || []} labelKey="path" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-slate-950">Последние визиты</h3>
          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {(analytics?.recentViews || []).length === 0 ? (
              <p className="text-xs font-semibold text-slate-400">Данных пока нет.</p>
            ) : analytics.recentViews.map((view) => (
              <div key={view.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-black text-slate-800" title={view.path}>{view.path}</span>
                  <span className="shrink-0 text-[10px] font-bold text-slate-400">{new Date(view.createdAt).toLocaleString('ru-RU')}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-400">
                  <span>{view.userId ? `Пользователь #${view.userId}` : 'Гость'}</span>
                  {view.referrer && <span className="truncate">Источник: {view.referrer}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
