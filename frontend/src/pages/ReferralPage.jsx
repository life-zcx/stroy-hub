import React, { useEffect, useState } from 'react';
import { Users, Share2, Copy, Check, ShieldCheck, ArrowRight, Wallet, UserCheck, MessageSquare, Send } from 'lucide-react';
import { getReferralSummaryApi } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

export default function ReferralPage({ showToast, customer }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const result = await getReferralSummaryApi();
        setData(result);
      } catch (err) {
        console.error('Error fetching referral summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast?.('Реферальная ссылка скопирована');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    showToast?.('Реферальный код скопирован');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-150 shadow-xs space-y-6 animate-pulse text-left">
        <div className="h-8 bg-slate-100 rounded-xl w-64"></div>
        <div className="h-24 bg-slate-100 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
          <div className="h-20 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || { invitedCount: 0, activeReferralsCount: 0, totalBonusesEarned: 0 };

  const clientOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tormag.kz';
  const shareUrl = data?.referralCode ? `${clientOrigin}/?ref=${data.referralCode}` : (data?.shareUrl || '');
  const shareText = `Регистрация в сервисе TORMAG по реферальной ссылке: ${shareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Реферальная программа TORMAG')}`;

  return (
    <div className="space-y-6 text-left">
      {/* Header Card (Clean Profile Style) */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-5 sm:p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 font-outfit tracking-tight leading-snug">
            Приглашайте друзей: вам <span className="text-blue-600 font-black">+1 000 бонусов</span>, а другу — <span className="text-emerald-600 font-black">+500 бонусов</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Отправьте персональную ссылку или код другу. За регистрацию ваш друг сразу получит 500 ₸ бонусов, а после его первого заказа от 15 000 ₸ вам начислится 1 000 бонусов.
          </p>
        </div>
      </div>

      {/* Share Widget */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-150 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-950 font-outfit">
          Ваша ссылка и код для приглашения
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-2 overflow-hidden">
            <span className="text-xs font-semibold text-slate-700 truncate select-all">
              {shareUrl || 'Загрузка ссылки...'}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? 'Скопировано' : 'Копировать'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={whatsappUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-3 bg-[#25D366] hover:bg-[#20be5a] text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 text-decoration-none"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
            <a
              href={telegramUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-3 bg-[#229ED9] hover:bg-[#1d8cb0] text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 text-decoration-none"
            >
              <Send className="h-4 w-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Ваш уникальный код:</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="font-mono font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Нажмите для копирования кода"
          >
            {data?.referralCode || '—'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Приглашено</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-950 font-outfit">
            {stats.invitedCount}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Пользователей зарегистрировано</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Заказов получено</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-950 font-outfit">
            {stats.activeReferralsCount}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Активных покупателей</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Начислено бонусов</span>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-outfit">
            +{formatPrice(stats.totalBonusesEarned)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Доступно на вашем балансе</p>
        </div>
      </div>

      {/* Rules & Workflow */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-150 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-950 font-outfit flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Условия программы
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-extrabold text-blue-600 text-sm">1. Скопируйте ссылку</span>
            <p className="text-slate-500 leading-relaxed">
              Отправьте вашу реферальную ссылку или код новому пользователю.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-extrabold text-blue-600 text-sm">2. Регистрация и заказ</span>
            <p className="text-slate-500 leading-relaxed">
              Друг регистрируется (получая 500 ₸ бонусов) и совершает свой первый заказ от 15 000 ₸.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-extrabold text-blue-600 text-sm">3. Начисление вознаграждения</span>
            <p className="text-slate-500 leading-relaxed">
              После завершения заказа вы получаете 1 000 бонусов на ваш счет.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
