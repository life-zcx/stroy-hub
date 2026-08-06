import React, { useState } from 'react';
import { CheckCircle2, ShoppingBag, ArrowRight, Calendar, Gift, Package, Copy, Check, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { getPageHref } from '../utils/navigationHelper';
import Link from './Link';

export default function OrderSuccessCelebration({ successOrder, onNavigate, showToast }) {
  const [copied, setCopied] = useState(false);
  const earnedRefund = Math.round((successOrder?.totalAmount || 0) * 0.03);

  const handleCopyOrderId = () => {
    if (successOrder?.id) {
      navigator.clipboard.writeText(String(successOrder.id));
      setCopied(true);
      showToast?.('Номер заказа скопирован');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 text-left animate-fade-in-up">
      {/* Header Section: Compact & Inline */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center gap-3 flex-wrap">
          <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-outfit tracking-tight">
            Заказ успешно создан
          </h1>
        </div>
        <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
          Спасибо за заказ в <span className="font-extrabold text-slate-900">TORMAG</span>. Менеджеры уже приняли ваш заказ в работу и начали подготовку к отправке.
        </p>
      </div>

      {/* Main Order Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-150">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Номер заказа</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-outfit">#{successOrder?.id}</span>
              <button
                onClick={handleCopyOrderId}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Скопировать номер заказа"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Итого к оплате</span>
            {Boolean(successOrder?.usedBonusPoints && successOrder.usedBonusPoints > 0) && (
              <div className="text-xs text-emerald-600 font-extrabold">
                Списано бонусами: -{formatPrice(successOrder.usedBonusPoints)}
              </div>
            )}
            {Boolean(successOrder?.promoCode) && (
              <div className="text-xs text-emerald-600 font-extrabold">
                Промокод ({successOrder.promoCode}): -{formatPrice((successOrder.discountAmount || 0) - (successOrder.usedBonusPoints || 0))}
              </div>
            )}
            <div className="text-2xl font-black text-slate-900 font-outfit">{formatPrice(successOrder?.totalAmount || 0)}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Получатель</span>
            <p className="font-bold text-slate-800">{successOrder?.clientName}</p>
            <p className="text-slate-500 text-xs font-semibold">{successOrder?.clientPhone}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Адрес доставки</span>
            <p className="font-bold text-slate-800 leading-snug">{successOrder?.clientAddress}</p>
          </div>
          {successOrder?.deliveryDate && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Сроки доставки</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                {successOrder.deliveryDate}
              </p>
            </div>
          )}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Способ оплаты</span>
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md inline-block mt-0.5">
              {successOrder?.paymentMethod === 'kaspi' ? 'Kaspi QR / Kaspi Red' : successOrder?.paymentMethod === 'invoice' ? 'Безналичный расчет (B2B)' : 'Наличными при получении'}
            </span>
          </div>
        </div>

        {/* Cashback Banner */}
        <div className="bg-emerald-50/60 border border-emerald-100 p-4 sm:p-5 rounded-xl flex items-center gap-4">
          <div className="p-2.5 bg-emerald-600 text-white rounded-lg shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase block">Кешбэк 3%</span>
            <p className="text-sm font-black text-slate-900 font-outfit">Вам начислено +{formatPrice(earnedRefund)} бонусами</p>
            <p className="text-xs text-slate-500 font-medium">Бонусы активируются автоматически после получения заказа.</p>
          </div>
        </div>

        {/* Guarantee Info */}
        <div className="flex items-center gap-2.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Официальная гарантия и качество стройматериалов от TORMAG.KZ</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          href={getPageHref('catalog')}
          onClick={() => onNavigate('catalog')}
          className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 transform active:scale-95 text-center cursor-pointer"
        >
          <ShoppingBag className="h-5 w-5 text-slate-600" />
          <span>Продолжить покупки</span>
        </Link>
        <Link
          href={successOrder ? getPageHref('order-detail', successOrder.id) : '#'}
          onClick={() => {
            if (successOrder?.id) {
              onNavigate('order-detail', successOrder.id);
            }
          }}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95 text-center cursor-pointer"
        >
          <Package className="h-5 w-5" />
          <span>Отслеживать заказ</span>
          <ArrowRight className="h-5 w-5 ml-1" />
        </Link>
      </div>
    </div>
  );
}
