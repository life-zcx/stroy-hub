import React, { useMemo, useState } from 'react';
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  ShieldAlert as ShieldAlertIcon,
  ShieldCheck as ShieldCheckIcon,
} from 'lucide-react';
import UserModal from '../modals/UserModal';

const roleMeta = {
  ADMIN: {
    label: 'Администратор',
    className: 'bg-slate-900 text-white',
  },
  SUPPLIER: {
    label: 'Поставщик',
    className: 'bg-amber-100 text-amber-800',
  },
  CUSTOMER: {
    label: 'Клиент',
    className: 'bg-sky-100 text-sky-800',
  },
};

function StatCard({ title, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 shadow-sm flex items-center justify-between">
      <div className="min-w-0 pr-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 truncate">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{hint}</p>
      </div>
      <p className="text-xl font-black text-slate-950 font-outfit leading-none shrink-0">{value}</p>
    </div>
  );
}

export default function UsersPage({
  currentUser,
  users,
  suppliers,
  onCreateUser,
  onUpdateUser,
  onUpdateUserPassword,
  onToggleUserBlock,
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    suppliers: users.filter((user) => user.role === 'SUPPLIER').length,
    blocked: users.filter((user) => user.isBlocked).length,
  }), [users]);

  const openCreateModal = () => {
    setSelectedUser(null);
    setActionError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    if (selectedUser) {
      await onUpdateUser(selectedUser.id, {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        supplierId: formData.supplierId,
      });

      if (formData.password) {
        await onUpdateUserPassword(selectedUser.id, formData.password);
      }

      return;
    }

    await onCreateUser(formData);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        (user.name || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.phone || '').toLowerCase().includes(query);

      // 2. Role Filter
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

      // 3. Status Filter
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && !user.isBlocked) ||
        (statusFilter === 'BLOCKED' && user.isBlocked);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-outfit">Управление пользователями</h2>
          <p className="text-xs text-slate-500 mt-0.5">Роли, доступы, пароли и блокировка учетных записей</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Создать пользователя
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Всего" value={stats.total} hint="Учетные записи в системе" />
        <StatCard title="Админы" value={stats.admins} hint="С полным доступом" />
        <StatCard title="Поставщики" value={stats.suppliers} hint="С привязкой к складам" />
        <StatCard title="Заблокированы" value={stats.blocked} hint="Вход заблокирован" />
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
          {actionError}
        </div>
      )}

      {/* Modern Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по имени, email, телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-slate-900 focus:outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-slate-900 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL">Все роли</option>
            <option value="CUSTOMER">Клиенты</option>
            <option value="SUPPLIER">Поставщики</option>
            <option value="ADMIN">Администраторы</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:border-slate-900 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="BLOCKED">Заблокированные</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">Пользователи не найдены.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                  <th className="px-5 py-2.5 w-[35%]">Пользователь</th>
                  <th className="px-4 py-2.5 w-[20%]">Роль</th>
                  <th className="px-4 py-2.5 w-[20%]">Связь</th>
                  <th className="px-4 py-2.5 w-[15%]">Статус</th>
                  <th className="px-5 py-2.5 w-[10%] text-center">Заказы</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const role = roleMeta[user.role] || roleMeta.CUSTOMER;
                  const isCurrentUser = currentUser.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => window.location.hash = `user-portrait/${user.id}`}
                      className="border-b border-gray-50 hover:bg-slate-50/70 transition-colors align-middle cursor-pointer group"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {user.name || 'Без имени'}
                          </span>
                          <span className="text-slate-550 text-[11px]">{user.email}</span>
                          <span className="text-[10px] text-slate-400">
                            {user.phone || 'Телефон не указан'}{user.address ? ` • ${user.address}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${role.className}`}>
                            {role.label}
                          </span>
                          {user.supplierName && (
                            <div className="mt-1 text-[10px] font-bold text-slate-500">
                              Склад: {user.supplierName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-slate-400">
                        <div>
                          <div>Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</div>
                          <div className="mt-0.5">Обновлен: {new Date(user.updatedAt).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div>
                          {user.isBlocked ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-700">
                              <ShieldAlertIcon className="h-3 w-3" /> Блок
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                              <ShieldCheckIcon className="h-3 w-3" /> Активен
                            </span>
                          )}
                          {isCurrentUser && (
                            <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Ваш аккаунт</div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="text-base font-extrabold text-slate-900 font-outfit">{user.orderCount}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        suppliers={suppliers}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}

