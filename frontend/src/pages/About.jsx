import React from 'react';
import { Building2, Users, MapPin, Mail, Phone, Calendar } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left">

      {/* Editorial Title */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">О платформе Tormag</h1>
        <p className="text-slate-500 text-sm">Первый казахстанский B2B/B2C маркетплейс прямых дистрибьюторских поставок</p>
      </div>

      {/* Main Mission */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
        <h3 className="text-xl font-extrabold text-slate-950 font-outfit">Наша миссия</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Tormag — это современная технологическая платформа, созданная для оптимизации цепочки поставок строительных материалов на рынке Казахстана. Мы напрямую объединяем конечных покупателей (как частных застройщиков, так и крупные подрядные организации) с авторизованными складами заводов-производителей.
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">
          Используя передовые алгоритмы анализа цен и оптимизацию логистических потоков, мы исключаем многоуровневых посредников, снижаем издержки на логистику и гарантируем 100% оригинальность и качество поставляемой продукции.
        </p>
      </div>

      {/* Key stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-emerald-600 font-black text-3xl font-outfit">15+</div>
          <h4 className="font-extrabold text-slate-900 text-xs">Официальных дилеров</h4>
          <p className="text-slate-400 text-[10px]">Прямые склады Bosch, Knauf, Alina и др.</p>
        </div>

        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-blue-500 font-black text-3xl font-outfit">5 000+</div>
          <h4 className="font-extrabold text-slate-900 text-xs">Товаров в каталоге</h4>
          <p className="text-slate-400 text-[10px]">Строительные смеси, инструменты, краски</p>
        </div>

        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-green-500 font-black text-3xl font-outfit">24 часа</div>
          <h4 className="font-extrabold text-slate-900 text-xs">Среднее время доставки</h4>
          <p className="text-slate-400 text-[10px]">Собственный грузовой автопарк</p>
        </div>

      </div>

      {/* Contact Details */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-8">
        <h3 className="text-xl font-extrabold font-outfit text-emerald-400">Контакты головного офиса</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-slate-300">Адрес офиса:</span>
                <span className="text-slate-400 text-xs">г. Алматы, Бостандыкский район, пр. Аль-Фараби, 77/7</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-slate-300">Телефон поддержки:</span>
                <a href="tel:77077111653" className="text-white hover:text-emerald-400 transition-colors text-xs font-bold">8 (707) 711-16-53</a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-slate-300">Почта для партнерства:</span>
                <span className="text-slate-400 text-xs">partner@tormag.kz</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-slate-300">Режим работы:</span>
                <span className="text-slate-400 text-xs">Пн - Пт: 09:00 - 18:00 (Сб, Вс - выходные)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
