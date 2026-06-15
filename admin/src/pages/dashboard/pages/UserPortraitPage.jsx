import React, { useState, useEffect } from 'react';
import {
  ArrowLeft as ArrowLeftIcon,
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  Award as AwardIcon,
  Coins as CoinsIcon,
  X as XIcon,
  Activity as ActivityIcon,
} from 'lucide-react';
import { getUserPortrait, adjustUserBonuses } from '../../../services/api';

export default function UserPortraitPage({ userId, onBack, showToast }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState('');

  const fetchPortrait = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getUserPortrait(userId);
      setData(res);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить портрет пользователя: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPortrait();
    }
  }, [userId]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSuccessMsg('');
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt === 0) {
      setAdjustError('Введите корректное число бонусов');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Укажите причину корректировки');
      return;
    }

    setAdjustBusy(true);
    try {
      const res = await adjustUserBonuses(userId, amt, adjustReason);
      setAdjustSuccessMsg(res.message || 'Баланс успешно изменен');
      setAdjustAmount('');
      setAdjustReason('');
      if (showToast) {
        showToast('✅ Баланс бонусов пользователя успешно скорректирован!');
      }
      // Reload details
      const updated = await getUserPortrait(userId);
      setData(updated);
    } catch (err) {
      setAdjustError(err.response?.data?.error || err.message);
    } finally {
      setAdjustBusy(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Выполнен</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Отменен</span>;
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ожидает</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">В обработке</span>;
      case 'shipped':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Отгружен</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3 min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Загрузка портрета пользователя...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Назад к списку
        </button>
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
          {error || 'Не удалось найти указанного пользователя.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header / Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Назад к списку пользователей"
          >
            <ArrowLeftIcon className="w-4 h-4 text-slate-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-outfit">
              Портрет пользователя: {data.user.name || 'Без имени'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Email: {data.user.email} • ID: {data.user.id}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Quick Stats */}
        <div className="space-y-6">
          {/* Profile Details Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Основная информация</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <MailIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                  <p className="text-sm text-slate-800 font-medium break-all">{data.user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <PhoneIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Телефон</p>
                  <p className="text-sm text-slate-800 font-medium">{data.user.phone || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPinIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Адрес доставки</p>
                  <p className="text-sm text-slate-800 font-medium">{data.user.address || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CalendarIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Зарегистрирован</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {new Date(data.user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {data.user.supplierName && (
                <div className="flex items-start gap-2.5">
                  <ActivityIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Привязан к складу</p>
                    <p className="text-sm text-slate-800 font-bold">{data.user.supplierName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Stats Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Аналитика покупок</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-b border-slate-100 pb-2">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Всего заказов</p>
                <p className="text-lg font-black text-slate-900 font-outfit mt-1">{data.stats.totalOrders}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                  ({data.stats.completedOrders} вып. • {data.stats.cancelledOrders} отм.)
                </p>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Сумма покупок</p>
                <p className="text-lg font-black text-slate-950 font-outfit mt-1 text-blue-600">
                  {data.stats.totalSpent.toLocaleString('ru-RU')} ₸
                </p>
              </div>

              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Средний чек</p>
                <p className="text-lg font-black text-slate-900 font-outfit mt-1">
                  {data.stats.avgOrderValue.toLocaleString('ru-RU')} ₸
                </p>
              </div>

              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Оплата чаще всего</p>
                <p className="text-xs font-bold text-slate-755 mt-2 truncate" title={data.stats.favoritePaymentMethod}>
                  {data.stats.favoritePaymentMethod}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Loyalty, Bonuses & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loyalty Tier Progress */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Уровень программы лояльности</h4>
              <span className="flex items-center gap-1 text-[11px] font-black text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded-full">
                <AwardIcon className="w-3.5 h-3.5" />
                {data.loyalty.levelName}
              </span>
            </div>

            {/* Criteria & Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-medium text-slate-600">
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-400">Бонус на обычные товары</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{data.loyalty.baseCashbackPercent}%</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-400">Бонус на крупные покупки (&gt;1 млн ₸)</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{data.loyalty.highValueCashback}%</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-400">Лимит оплаты бонусами</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1">До {data.loyalty.maxBonusPaymentPercent}% заказа</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-400">Потрачено в этом году</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{data.loyalty.totalSpentThisYear.toLocaleString('ru-RU')} ₸</p>
              </div>
            </div>

            {/* Progress bar to next level */}
            {data.loyalty.nextLevel && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Прогресс до уровня «{data.loyalty.nextLevelName}»</span>
                  <span className="text-slate-700">{data.loyalty.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.loyalty.progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold text-right">
                  Нужно совершить покупок еще на {data.loyalty.neededToNextLevel.toLocaleString('ru-RU')} ₸
                </p>
              </div>
            )}
          </div>

          {/* Bonuses & Action Adjust form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats cards */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Бонусный баланс</h4>
              
              <div className="grid grid-cols-2 gap-4 flex-1 mt-2">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Доступно</p>
                  <p className="text-2xl font-black text-emerald-600 font-outfit mt-1 flex items-center gap-1">
                    {data.bonuses.available.toLocaleString('ru-RU')}
                    <span className="text-xs font-semibold">₸</span>
                  </p>
                </div>

                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Ожидают начисления</p>
                  <p className="text-2xl font-black text-slate-400 font-outfit mt-1 flex items-center gap-1">
                    {data.bonuses.pending.toLocaleString('ru-RU')}
                    <span className="text-xs font-semibold">₸</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Всего начислено</p>
                  <p className="text-sm font-extrabold text-slate-700 mt-1">
                    {data.bonuses.totalEarned.toLocaleString('ru-RU')} ₸
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Всего потрачено</p>
                  <p className="text-sm font-extrabold text-slate-700 mt-1">
                    {data.bonuses.totalSpent.toLocaleString('ru-RU')} ₸
                  </p>
                </div>
              </div>
            </div>

            {/* Manual adjustment form */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <CoinsIcon className="w-4 h-4 text-amber-500" />
                Корректировка бонусов
              </h4>

              <form onSubmit={handleAdjust} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Сумма (положительная или отрицательная)</label>
                  <input
                    type="number"
                    placeholder="Пример: 1500 или -500"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Причина начисления / списания</label>
                  <input
                    type="text"
                    placeholder="Пример: Бонус за лояльность B2B"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {adjustError && (
                  <div className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
                    {adjustError}
                  </div>
                )}

                {adjustSuccessMsg && (
                  <div className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                    {adjustSuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adjustBusy}
                  className="w-full flex items-center justify-center gap-1 py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-60 transition-colors"
                >
                  Применить корректировку
                </button>
              </form>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Последние заказы в системе</h4>
            {data.recentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-4">Этот пользователь еще не совершал заказов.</p>
            ) : (
              <div className="overflow-x-auto max-h-[300px] border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="px-4 py-3">Заказ</th>
                      <th className="px-4 py-3">Дата</th>
                      <th className="px-4 py-3">Сумма</th>
                      <th className="px-4 py-3">Оплата</th>
                      <th className="px-4 py-3">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 font-outfit">#{order.id}</td>
                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {order.totalAmount.toLocaleString('ru-RU')} ₸
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-semibold">{order.paymentMethod}</td>
                        <td className="px-4 py-3">{getOrderStatusBadge(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
