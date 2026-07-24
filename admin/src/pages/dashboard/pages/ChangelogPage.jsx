import React from 'react';
import { Zap, Shield, Calendar, Wrench, Building2, UserCheck, Settings, AlertCircle, Sparkles } from 'lucide-react';

const CHANGELOG_DATA = [
  {
    id: 'v1.2.0',
    version: '1.2.0',
    date: '24 июля 2026',
    title: 'Страница 404, BlockedPage, 89 городов, чистка консоли и перенос Changelog',
    badge: 'Текущая версия',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    highlights: [
      {
        icon: AlertCircle,
        type: 'Новая страница',
        title: 'Страница 404 — «Страница не найдена»',
        desc: 'Создана страница NotFoundPage.jsx. useNavigation теперь возвращает состояние «404» для любого нераспознанного URL вместо перенаправления на главную. Страница содержит иконку компаса, кнопки «На главную» и «В каталог».'
      },
      {
        icon: Shield,
        type: 'Новая страница',
        title: 'Страница блокировки аккаунта (BlockedPage)',
        desc: 'Создана BlockedPage.jsx — отображается если у пользователя isBlocked: true. Содержит красную карточку с иконкой щита, причину блокировки, кнопки «Заказать обратный звонок» и «Выйти из аккаунта».'
      },
      {
        icon: Building2,
        type: 'Функционал',
        title: 'Все 89 регионов Казахстана в выборе города',
        desc: 'RegionModal дополнен полным списком из 89 городов Казахстана по всем областям: Алматинская, Астана, Шымкент, Туркестанская, Карагандинская и прочие. Ранее было ~15 крупных городов.'
      },
      {
        icon: UserCheck,
        type: 'UI / UX',
        title: 'Стиль RegionModal и ComingSoonModal приведён к дизайн-системе сайта',
        desc: 'Оба модальных окна полностью переработаны в стиле основного сайта TORMAG: тёмные акценты, скруглённые карточки, правильные шрифты и цветовые токены. Убраны лишние элементы из ComingSoonModal (дата таймер, промо-блок). Убрана анимация наведения.'
      },
      {
        icon: Wrench,
        type: 'Исправление',
        title: 'Устранение предупреждений в консоли браузера',
        desc: 'Устранены: GET /api/auth/me 401 у неавторизованных гостей (добавлена проверка токена перед запросом), DOM-подсказки autoComplete=\"username\" и autoComplete=\"current-password / new-password\" добавлены во все поля AuthModal.'
      },
      {
        icon: Settings,
        type: 'Безопасность',
        title: 'Changelog перенесён из публичного сайта в админ-панель',
        desc: 'Страница /changelog удалена из публичной маршрутизации frontend. Changelog теперь доступен только в административной панели (вкладка «Changelog»). SEO-метатег noindex/nofollow не требуется — страницы нет в публичном роутинге.'
      }
    ]
  },
  {
    id: 'v1.1.0',
    version: '1.1.0',
    date: '24 июля 2026',
    title: 'Регистрация юридических лиц, админ-панель B2B и исправление портрета',
    badge: 'Ранее',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    highlights: [
      {
        icon: Building2,
        type: 'Новая функция',
        title: 'Выбор типа аккаунта: Физлицо / Юрлицо',
        desc: 'При регистрации добавлена возможность выбора юридического лица с заполнением БИН/ИИН, наименования организации, ФИО руководителя, юр. адреса и формы собственности (ТОО, ИП, АО).'
      },
      {
        icon: UserCheck,
        type: 'UI / UX',
        title: 'Широкий двухколоночный макет и SVG-иконки дизайн-системы',
        desc: 'Форма регистрации юрлиц адаптирована в двухколоночный горизонтальный сетчатый макет. Текстовые эмодзи заменены на векторные иконки Lucide в полном соответствии со спецификацией DESIGN_SYSTEM.md.'
      },
      {
        icon: Settings,
        type: 'Админ-панель',
        title: 'Управление юрлицами и быстрая кнопка редактирования',
        desc: 'В модальное окно создания и редактирования пользователей добавлена поддержка B2B-реквизитов. В таблицу пользователей внедрена явная кнопка редактирования (Pencil), поиск по БИН/названию и бейджи «ЮР».'
      },
      {
        icon: AlertCircle,
        type: 'Исправление',
        title: 'Устранение ошибки загрузки портрета пользователя',
        desc: 'Исправлена ошибка ReferenceError в контроллере getUserPortrait при рассчете агрегированных статистик заказов и привязке B2B-данных организации.'
      },
      {
        icon: Wrench,
        type: 'Исправление',
        title: 'Связь складов в Prisma при сохранении пользователя',
        desc: 'Исправлена ошибка «Unknown argument supplierId» при обновлении профилей клиентов и поставщиков через админ-панель за счет использования вложенных связей Prisma (connect/disconnect).'
      }
    ]
  },
  {
    id: 'v1.0.0',
    version: '1.0.0',
    date: '24 июля 2026',
    title: 'Оптимизация производительности, безопасность и исправление запуска',
    badge: 'Ранее',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    highlights: [
      {
        icon: Zap,
        type: 'Оптимизация',
        title: 'Устранение N+1 запросов при фильтрации по категориям',
        desc: 'Переработана функция поиска дочерних подкатегорий (getDescendantCategorySlugsAndIds). Дерево категорий теперь загружается за 1 запрос к PostgreSQL и строится в памяти, сэкономив до 50 повторных SQL-запросов.'
      },
      {
        icon: Shield,
        type: 'Безопасность',
        title: 'Атомарные транзакции Prisma в управлении пользователями',
        desc: 'Смена ролей, сброс прав и блокировка пользователей обёрнуты в prisma.$transaction с проверкой наличия резервного администратора во избежание состояния гонки.'
      },
      {
        icon: Zap,
        type: 'CRM & Запросы',
        title: 'Параллельное получение данных портрета клиента',
        desc: '11 последовательных запросов агрегаций заказов, бонусов, поисков и корзины в getUserPortrait объединены в параллельный вызов через Promise.all.'
      },
      {
        icon: Wrench,
        type: 'Исправление',
        title: 'Конфигурация окружения и локальный запуск',
        desc: 'Исправлена ошибка отсутствия JWT_SECRET в локальном .env файле, добавлен автоматический фолбэк для среды разработки.'
      }
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Панель управления • Системный журнал</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-outfit">
            История обновлений платформы TORMAG
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Внутренний журнал выполненных технических доработок, исправлений багов и новых бизнес-функций.
          </p>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-slate-200 before:z-0">
        {CHANGELOG_DATA.map((release) => (
          <div key={release.id} className="relative z-10 pl-9 sm:pl-12">
            
            {/* Timeline Dot */}
            <div className="absolute left-2 sm:left-4 -translate-x-1/2 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-emerald-600 ring-4 ring-emerald-500/20" />

            {/* Release Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-5">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-slate-900 font-outfit">Релиз {release.version}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${release.badgeColor}`}>
                      {release.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{release.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>{release.date}</span>
                </div>
              </div>

              {/* Highlights Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {release.highlights.map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <ItemIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.type}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
