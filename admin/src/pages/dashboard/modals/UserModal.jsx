import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert as ShieldAlertIcon, X as XIcon } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Клиент' },
  { value: 'SUPPLIER', label: 'Поставщик' },
  { value: 'ADMIN', label: 'Администратор' },
];

function buildInitialForm(user) {
  return {
    email: user?.email || '',
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || 'CUSTOMER',
    supplierId: user?.supplierId ? String(user.supplierId) : '',
    password: '',
  };
}

export default function UserModal({ open, onClose, user, suppliers, onSubmit }) {
  const [form, setForm] = useState(buildInitialForm(user));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(user));
    setError('');
    setSaving(false);
  }, [user, open]);

  const isEditMode = Boolean(user);
  const requiresSupplier = form.role === 'SUPPLIER';

  const title = useMemo(
    () => (isEditMode ? 'Редактировать пользователя' : 'Создать пользователя'),
    [isEditMode]
  );

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === 'supplierId' ? value : value,
      ...(name === 'role' && value !== 'SUPPLIER' ? { supplierId: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Укажите email.');
      return;
    }

    if (!isEditMode && form.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.');
      return;
    }

    if (isEditMode && form.password && form.password.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов.');
      return;
    }

    if (requiresSupplier && !form.supplierId) {
      setError('Для роли поставщика нужно выбрать склад.');
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        role: form.role,
        supplierId: form.role === 'SUPPLIER' ? form.supplierId : null,
        password: form.password,
      });
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <ShieldAlertIcon className="h-5.5 w-5.5 text-slate-900" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Роль *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Имя</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Телефон</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Адрес</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            {requiresSupplier && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Склад поставщика *</label>
                <select
                  name="supplierId"
                  value={form.supplierId}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
                >
                  <option value="">Выбрать склад...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                {isEditMode ? 'Новый пароль' : 'Пароль *'}
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={isEditMode ? 'Оставьте пустым, если менять не нужно' : 'Минимум 6 символов'}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
              Отмена
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold rounded-xl transition-all text-sm shadow-md">
              {saving ? 'Сохраняю...' : isEditMode ? 'Сохранить пользователя' : 'Создать пользователя'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
