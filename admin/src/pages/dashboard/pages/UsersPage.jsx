import React, { useMemo, useState } from 'react';
import {
  Edit3 as EditIcon,
  Lock as LockIcon,
  Plus as PlusIcon,
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-extrabold text-slate-950 font-outfit">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
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
  const [busyUserId, setBusyUserId] = useState(null);

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

  const openEditModal = (user) => {
    setSelectedUser(user);
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

  const handleToggleBlock = async (user) => {
    setActionError('');
    setBusyUserId(user.id);

    try {
      await onToggleUserBlock(user.id, !user.isBlocked);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Управление пользователями</h2>
          <p className="text-xs text-slate-500 mt-0.5">Роли, доступы, пароли и блокировка учетных записей</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Создать пользователя
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Всего" value={stats.total} hint="Все учетные записи в системе" />
        <StatCard title="Админы" value={stats.admins} hint="Пользователи с полным доступом" />
        <StatCard title="Поставщики" value={stats.suppliers} hint="Аккаунты, привязанные к складам" />
        <StatCard title="Заблокированы" value={stats.blocked} hint="Не смогут входить по токену и паролю" />
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {actionError}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-16 text-center text-slate-500">Пользователей пока нет.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4">Пользователь</th>
                  <th className="px-4 py-4">Роль</th>
                  <th className="px-4 py-4">Связь</th>
                  <th className="px-4 py-4">Статус</th>
                  <th className="px-4 py-4">Заказы</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const role = roleMeta[user.role] || roleMeta.CUSTOMER;
                  const isCurrentUser = currentUser.id === user.id;

                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-slate-50/70 transition-colors align-top">
                      <td className="px-6 py-4 min-w-[280px]">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-900">{user.name || 'Без имени'}</span>
                          <span className="text-sm text-slate-600">{user.email}</span>
                          <span className="text-xs text-slate-400">
                            {user.phone || 'Телефон не указан'}{user.address ? ` • ${user.address}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${role.className}`}>
                          {role.label}
                        </span>
                        {user.supplierName && (
                          <div className="mt-2 text-xs font-semibold text-slate-500">Склад: {user.supplierName}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        <div>Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</div>
                        <div className="mt-1">Обновлен: {new Date(user.updatedAt).toLocaleDateString('ru-RU')}</div>
                      </td>
                      <td className="px-4 py-4">
                        {user.isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-700">
                            <ShieldAlertIcon className="h-3.5 w-3.5" /> Заблокирован
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                            <ShieldCheckIcon className="h-3.5 w-3.5" /> Активен
                          </span>
                        )}
                        {isCurrentUser && (
                          <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Это ваш аккаунт</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-lg font-extrabold text-slate-900">{user.orderCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <EditIcon className="h-3.5 w-3.5" /> Редактировать
                          </button>
                          <button
                            onClick={() => handleToggleBlock(user)}
                            disabled={busyUserId === user.id}
                            className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all disabled:opacity-60 ${
                              user.isBlocked
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            <LockIcon className="h-3.5 w-3.5" /> {user.isBlocked ? 'Разблокировать' : 'Блокировать'}
                          </button>
                        </div>
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
