import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert as ShieldAlertIcon, X as XIcon, User as UserIcon, Building2 as Building2Icon } from 'lucide-react';

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
    entityType: user?.entityType || 'PHYSICAL',
    companyBin: user?.companyBin || '',
    companyName: user?.companyName || '',
    directorName: user?.directorName || '',
    legalAddress: user?.legalAddress || '',
    organizationType: user?.organizationType || '',
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
      [name]: value,
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

    if (form.entityType === 'LEGAL') {
      if (!form.companyBin.trim() || !form.companyName.trim()) {
        setError('Заполните БИН/ИИН и наименование организации.');
        return;
      }
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
        entityType: form.entityType,
        companyBin: form.entityType === 'LEGAL' ? form.companyBin.trim() : null,
        companyName: form.entityType === 'LEGAL' ? form.companyName.trim() : null,
        directorName: form.entityType === 'LEGAL' ? form.directorName.trim() : null,
        legalAddress: form.entityType === 'LEGAL' ? form.legalAddress.trim() : null,
        organizationType: form.entityType === 'LEGAL' ? form.organizationType : null,
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

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <ShieldAlertIcon className="h-5.5 w-5.5 text-slate-900" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Entity Type Switcher */}
        <div className="flex items-center justify-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, entityType: 'PHYSICAL' }))}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all border flex items-center justify-center gap-1.5 ${
              form.entityType === 'PHYSICAL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="h-4 w-4 shrink-0" />
            <span>Физическое лицо</span>
          </button>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, entityType: 'LEGAL' }))}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all border flex items-center justify-center gap-1.5 ${
              form.entityType === 'LEGAL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Building2Icon className="h-4 w-4 shrink-0" />
            <span>Юридическое лицо</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Legal Entity Fields Section */}
          {form.entityType === 'LEGAL' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center gap-1.5">
                <Building2Icon className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Данные организации</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">БИН или ИИН *</label>
                  <input
                    type="text"
                    name="companyBin"
                    value={form.companyBin}
                    onChange={handleChange}
                    maxLength={12}
                    placeholder="Введите БИН или ИИН"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Наименование организации *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Введите наименование"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">ФИО руководителя</label>
                  <input
                    type="text"
                    name="directorName"
                    value={form.directorName}
                    onChange={handleChange}
                    placeholder="Введите ФИО руководителя"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Тип организации</label>
                  <select
                    name="organizationType"
                    value={form.organizationType}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
                  >
                    <option value="">Выберите тип организации</option>
                    <option value="ТОО">ТОО (Товарищество с ограниченной ответственностью)</option>
                    <option value="ИП">ИП (Индивидуальный предприниматель)</option>
                    <option value="АО">АО (Акционерное общество)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Юридический адрес</label>
                  <input
                    type="text"
                    name="legalAddress"
                    value={form.legalAddress}
                    onChange={handleChange}
                    placeholder="Введите юридический адрес"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

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
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                {form.entityType === 'LEGAL' ? 'ФИО контактного лица' : 'Имя'}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={form.entityType === 'LEGAL' ? 'Иванов Иван' : 'Александр'}
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
                placeholder="+7 (707) 123-45-67"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Адрес доставки</label>
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
