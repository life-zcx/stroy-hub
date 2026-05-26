import React from 'react';
import {
  FileSpreadsheet as FileSpreadsheetIcon,
  BadgeCheck as BadgeCheckIcon,
  Layers as LayersIcon,
  Package as PackageIcon,
  PhoneCall as PhoneCallIcon,
  TicketPercent as TicketPercentIcon,
  ShieldAlert as ShieldAlertIcon,
  UserCheck as UserCheckIcon,
} from 'lucide-react';

const tabIcons = {
  products: PackageIcon,
  orders: FileSpreadsheetIcon,
  callbacks: PhoneCallIcon,
  promotions: TicketPercentIcon,
  brands: BadgeCheckIcon,
  categories: LayersIcon,
  suppliers: UserCheckIcon,
  users: ShieldAlertIcon,
};

const tabLabels = {
  products: 'Мои товары',
  orders: 'Заказы',
  callbacks: 'Обратные звонки',
  promotions: 'Акции и скидки',
  brands: 'Бренды-партнеры',
  categories: 'Разделы каталога',
  suppliers: 'Дистрибьюторы',
  users: 'Пользователи',
};

export default function DashboardTabs({ activePage, onPageChange, pages, counts }) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto pb-px">
      {pages.map((page) => {
        const Icon = tabIcons[page];
        const isActive = activePage === page;

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors ${
              isActive
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-950'
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
            {tabLabels[page]} ({counts[page] ?? 0})
          </button>
        );
      })}
    </div>
  );
}
