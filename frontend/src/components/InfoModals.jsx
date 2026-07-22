import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Tag, Truck, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  CreditCard, DollarSign, Wallet, Percent, MapPin, Calendar, Clock, RotateCcw,
  Coins, ArrowRight, Copy, Share2
} from 'lucide-react';

export default function InfoModals({ isOpen, type, onClose, showToast }) {
  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-[28px] shadow-2xl w-full max-h-[85vh] relative animate-fade-in-up z-10 border border-slate-150 flex flex-col cursor-default overflow-hidden ${type === 'priceAlert' || type === 'share' ? 'max-w-sm' : 'max-w-2xl'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors z-20 bg-white/90 backdrop-blur-md shadow-sm border border-slate-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {type === 'lowPrice' && <LowPriceContent />}
          {type === 'delivery' && <DeliveryContent />}
          {type === 'returns' && <ReturnsContent />}
          {type === 'priceAlert' && (
            <PriceAlertContent onClose={onClose} showToast={showToast} />
          )}
          {type === 'share' && (
            <ShareContent onClose={onClose} showToast={showToast} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────── */
/* 1. ГАРАНТИЯ НИЗКОЙ ЦЕНЫ CONTENT */
/* ──────────────────────────────────────────────────────── */
function LowPriceContent() {
  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <Coins className="h-6 w-6 text-slate-900 shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit tracking-tight">Гарантия низкой цены</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Нашли дешевле? Компенсируем 110% разницы</p>
        </div>
      </div>

      {/* Main highlight banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          <span>Гарантия 14 дней в сети «TORMAG»</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          Если в течение 14 дней после покупки вы нашли аналогичный товар дешевле у конкурента — мы компенсируем 110% разницы бонусами на ваш счёт!
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Как получить компенсацию?</h3>
        <div className="space-y-3">
          <div className="flex gap-3.5 items-start bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs font-mono mt-0.5">1</span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900">Покупка или плановый заказ</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Вы совершили покупку или планируете заказ на сайте tormag.kz.</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs font-mono mt-0.5">2</span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900">Ссылка или чеки конкурента</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Предоставьте ссылку или чек из магазина стройматериалов Казахстан с более низкой ценой в течение 14 дней.</p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs font-mono mt-0.5">3</span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900">Получение 110% выгоды</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Получите 110% разницы бонусами на свой счет TORMAG Club или покупку по лучшей цене.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Условия акции</span>
        </h4>
        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-500 font-medium leading-relaxed">
          <li>Товар у конкурента должен быть в наличии в г. Алматы.</li>
          <li>Акционные товары и распродажи конкурентов не участвуют.</li>
          <li>Для юридических лиц компенсация согласуется индивидуально менеджером B2B.</li>
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* 2. УСЛОВИЯ ДОСТАВКИ И САМОВЫВОЗА CONTENT */
/* ──────────────────────────────────────────────────────── */
function DeliveryContent() {
  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <Truck className="h-6 w-6 text-slate-900 shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit tracking-tight">Доставка и самовывоз</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Быстрая логистика со складов дилеров</p>
        </div>
      </div>

      {/* Delivery modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Экспресс-доставка</span>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Доставка день в день или на следующий день собственным автопарком со спецтехникой.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Пункты самовывоза</span>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Бесплатный самовывоз из сети складских комплексов и розничных гипермаркетов.
          </p>
        </div>
      </div>

      {/* Payment methods section */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Способы оплаты</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Kaspi QR / Kaspi Red</h4>
            <p className="text-[11px] text-slate-500 font-medium">Оплата курьеру при получении.</p>
          </div>
          <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Безналичный расчет (B2B)</h4>
            <p className="text-[11px] text-slate-500 font-medium">Для юридических лиц (ТОО/ИП) с выпиской ЭСФ и документов.</p>
          </div>
          <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Банковские карты</h4>
            <p className="text-[11px] text-slate-500 font-medium">Visa, MasterCard при получении.</p>
          </div>
          <div className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
            <h4 className="text-xs font-bold text-slate-900">Наличный расчет</h4>
            <p className="text-[11px] text-slate-500 font-medium">Оплата курьеру при доставке или на кассе самовывоза.</p>
          </div>
        </div>
      </div>

      {/* FAQ Accordions */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Частые вопросы</h3>
        <div className="space-y-2">
          <AccordionItem
            title="Как отследить статус заказа?"
            content="Статус заказа в реальном времени отображается в личном кабинете в разделе «Мои заказы»."
          />
          <AccordionItem
            title="Есть ли бесплатная доставка?"
            content="Бесплатная доставка предоставляется при выполнении условий по сумме заказа или акционным товарам."
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* 3. УСЛОВИЯ ВОЗВРАТА И ОБМЕНА CONTENT */
/* ──────────────────────────────────────────────────────── */
function ReturnsContent() {
  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <RotateCcw className="h-6 w-6 text-slate-900 shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit tracking-tight">Обмен и возврат</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">14 дней на гарантированный возврат товаров</p>
        </div>
      </div>

      <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-semibold">
        <p>
          Согласно Закону РК «О защите прав потребителей», вы можете вернуть или обменять любой товар надлежащего качества в течение 14 дней с момента покупки.
        </p>
      </div>

      {/* Procedure */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Что нужно для возврата:</h3>
        <ul className="space-y-2 text-xs text-slate-600 font-medium">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Сохранённый товарный вид и заводская упаковка.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Отсутствие следов установки и эксплуатационных повреждений.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Чек, накладная или электронный номер заказа в приложении.</span>
          </li>
        </ul>
      </div>

      {/* Non-returnable list */}
      <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>Ограничения по возврату</span>
        </h4>
        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600 font-medium leading-relaxed">
          <li>Колерованная по заказу краска и штукатурка.</li>
          <li>Кабельная продукция и нарезанные строительные материалы.</li>
          <li>Открытые сухие смеси с повреждением защитной упаковочной пленки.</li>
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* ACCORDION UTILITY COMPONENT */
/* ──────────────────────────────────────────────────────── */
function AccordionItem({ title, content }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex justify-between items-center text-xs font-bold text-slate-800 hover:bg-slate-100 text-left transition-colors cursor-pointer"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-3.5 pt-0 text-xs text-slate-600 font-medium leading-relaxed bg-white border-t border-slate-100">
          {content}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* PRICE ALERT MODAL CONTENT */
/* ──────────────────────────────────────────────────────── */
function PriceAlertContent({ onClose, showToast }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showToast) {
      showToast(`Уведомление о снижении цены настроено на адрес: ${email}`);
    }
    onClose();
  };

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900 font-outfit">Уведомить о скидке</h2>
        <p className="text-xs text-slate-500 font-medium">Пришлем письмо, как только цена снизится.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Электронная почта</label>
          <input
            type="email"
            required
            placeholder="example@mail.kz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs font-semibold outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition-all flex items-center justify-center text-xs shadow-md uppercase tracking-wider cursor-pointer"
        >
          Подписаться на скидку
        </button>
      </form>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* SHARE MODAL CONTENT */
/* ──────────────────────────────────────────────────────── */
function ShareContent({ onClose, showToast }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      if (showToast) {
        showToast('Ссылка скопирована в буфер обмена');
      }
    }
    onClose();
  };

  const handleShareClick = (platform, shareLink) => {
    window.open(shareLink, '_blank', 'noopener,noreferrer');
    if (showToast) {
      showToast(`Открываем ссылку для публикации в ${platform}`);
    }
    onClose();
  };

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900 font-outfit">Поделиться товаром</h2>
        <p className="text-xs text-slate-500 font-medium">Выберите удобный мессенджер или скопируйте ссылку.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleShareClick('WhatsApp', `https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`)}
          className="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
        >
          <span>WhatsApp</span>
        </button>

        <button
          onClick={() => handleShareClick('Telegram', `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`)}
          className="p-3.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/60 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
        >
          <span>Telegram</span>
        </button>
      </div>

      <button
        onClick={handleCopyLink}
        className="w-full p-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider"
      >
        <Copy className="h-4 w-4" />
        <span>Скопировать ссылку</span>
      </button>
    </div>
  );
}
