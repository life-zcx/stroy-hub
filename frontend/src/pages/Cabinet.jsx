import React, { useState, useEffect } from 'react';
import {
  User, Building2, ClipboardList, Tag, LogOut, Edit3, Check, X,
  Phone, Mail, MapPin, RefreshCw, ShieldCheck, Lock, Gift, Plus, Trash2, CheckCircle2, Star,
} from 'lucide-react';
import { updateProfile, forgotPassword, resetPassword } from '../services/api';
import { CABINET_TAB_PATHS } from '../hooks/useNavigation';
import MyOrders from './MyOrders';
import MyPromotions from './MyPromotions';
import { formatPrice } from '../utils/formatPrice';
import AddressMapPicker from '../components/AddressMapPicker';

// ─── Kazakhstan cities for profile addresses ──────────────────────────────────
const KAZAKHSTAN_CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Караганда', 'Тараз', 'Павлодар', 'Кызылорда', 'Актобе',
  'Усть-Каменогорск', 'Семей', 'Атырау', 'Актау', 'Уральск', 'Костанай', 'Петропавловск',
  'Темиртау', 'Туркестан', 'Кокшетау', 'Талдыкорган', 'Экибастуз', 'Рудный', 'Жанаозен'
];

// ─── User Addresses Section ───────────────────────────────────────────────────
function UserAddressesSection({ customer, showToast, onCustomerUpdate }) {
  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addressForm, setAddressForm] = useState({
    city: 'Алматы',
    street: '',
    details: '',
    isDefault: false
  });

  useEffect(() => {
    if (customer?.addresses && Array.isArray(customer.addresses) && customer.addresses.length > 0) {
      setAddresses(customer.addresses);
    } else if (customer?.address) {
      setAddresses([{
        id: 'legacy_1',
        city: 'Алматы',
        street: customer.address,
        details: '',
        isDefault: true
      }]);
    } else {
      setAddresses([]);
    }
  }, [customer]);

  const saveAddressesToBackend = async (newAddresses) => {
    setSaving(true);
    try {
      const defaultAddrObj = newAddresses.find(a => a.isDefault) || newAddresses[0];
      const defaultAddrStr = defaultAddrObj 
        ? `г. ${defaultAddrObj.city ? defaultAddrObj.city : ''}, ${defaultAddrObj.street}${defaultAddrObj.details ? `, ${defaultAddrObj.details}` : ''}`
        : '';
      
      const updated = await updateProfile({
        addresses: newAddresses,
        address: defaultAddrStr
      });
      onCustomerUpdate?.(updated);
      showToast?.('Адреса сохранены');
      setShowAddForm(false);
      setEditingId(null);
      setAddressForm({ city: 'Алматы', street: '', details: '', isDefault: false });
    } catch (err) {
      showToast?.('Ошибка сохранения адреса');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = (id) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setAddresses(updated);
    saveAddressesToBackend(updated);
  };

  const handleDelete = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    saveAddressesToBackend(updated);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!addressForm.street.trim()) {
      showToast?.('Укажите улицу и дом');
      return;
    }

    let updated = [];
    if (editingId) {
      updated = addresses.map(a => a.id === editingId ? { ...addressForm, id: editingId } : a);
    } else {
      const newId = 'addr_' + Date.now();
      const isFirst = addresses.length === 0;
      const shouldBeDefault = addressForm.isDefault || isFirst;
      updated = [...addresses, { ...addressForm, id: newId, isDefault: shouldBeDefault }];
    }

    if (addressForm.isDefault) {
      const activeId = editingId || updated[updated.length - 1].id;
      updated = updated.map(a => ({
        ...a,
        isDefault: a.id === activeId
      }));
    }

    setAddresses(updated);
    saveAddressesToBackend(updated);
  };

  const handleStartEdit = (addr) => {
    setEditingId(addr.id);
    setAddressForm({
      city: addr.city || 'Алматы',
      street: addr.street || '',
      details: addr.details || '',
      isDefault: !!addr.isDefault
    });
    setShowAddForm(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-5 w-5 text-[#1b5fc1]" />
          <div className="text-left">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Адреса доставки</h3>
            <p className="text-xs text-slate-400 font-medium">Управляйте сохраненными адресами доставки для быстрой покупки</p>
          </div>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setAddressForm({
                city: 'Алматы',
                street: '',
                details: '',
                isDefault: addresses.length === 0
              });
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 bg-[#ecf3fe] hover:bg-[#deebff] text-[#1b5fc1] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Добавить адрес
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveForm} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in text-left">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {editingId ? 'Редактирование адреса' : 'Новый адрес доставки'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Map Address Picker */}
            <div>
              <AddressMapPicker
                initialCity={addressForm.city || 'Алматы'}
                initialStreet={addressForm.street || ''}
                onSelectAddress={({ city, street }) => {
                  setAddressForm(f => ({
                    ...f,
                    city: city || f.city,
                    street: street || ''
                  }));
                }}
              />
            </div>

            {/* Inputs */}
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Город *</label>
                  <input
                    type="text"
                    list="city-options-list-cab"
                    value={addressForm.city}
                    onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Алматы"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1b5fc1]"
                  />
                  <datalist id="city-options-list-cab">
                    {KAZAKHSTAN_CITIES.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Улица и дом *</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
                    placeholder="пр. Абая, д. 150"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1b5fc1]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Квартира / офис, этаж, подъезд (опционально)</label>
                  <input
                    type="text"
                    value={addressForm.details}
                    onChange={e => setAddressForm(f => ({ ...f, details: e.target.value }))}
                    placeholder="кв. 42, 5 этаж, код 123"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1b5fc1]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefaultAddrCheck"
                    checked={addressForm.isDefault}
                    onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))}
                    className="h-4 w-4 text-[#1b5fc1] rounded border-slate-300 focus:ring-[#1b5fc1] cursor-pointer"
                  />
                  <label htmlFor="isDefaultAddrCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Сделать основным адресом для заказов
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Сохранить адрес
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Address cards list */}
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100 text-left">
        {addresses.length === 0 && !showAddForm && (
          <div className="py-6 text-center text-slate-400 text-xs font-medium">
            У вас пока нет сохраненных адресов. Нажмите «Добавить адрес», чтобы создать ваш адрес доставки.
          </div>
        )}

        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="py-3.5 flex items-center justify-between gap-3 group"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 shrink-0">
                <MapPin className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-left space-y-0.5 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {addr.city ? `${addr.city}, ` : ''}{addr.street}
                </p>
                {addr.details && (
                  <p className="text-xs font-normal text-slate-500 truncate">
                    {addr.details}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSetDefault(addr.id)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title={addr.isDefault ? "Основной адрес" : "Сделать основным"}
              >
                <Star className={`w-4 h-4 ${addr.isDefault ? 'text-[#1b5fc1] fill-[#1b5fc1]' : 'text-slate-400 hover:text-slate-600'}`} />
              </button>

              <button
                type="button"
                onClick={() => handleStartEdit(addr)}
                className="p-1.5 text-slate-400 hover:text-[#1b5fc1] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Редактировать"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(addr.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile edit tab ─────────────────────────────────────────────────────────
function ProfileTab({ customer, showToast, onCustomerUpdate, bonuses }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    companyBin: customer?.companyBin || '',
    companyName: customer?.companyName || '',
    directorName: customer?.directorName || '',
    legalAddress: customer?.legalAddress || '',
    organizationType: customer?.organizationType || '',
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      companyBin: customer?.companyBin || '',
      companyName: customer?.companyName || '',
      directorName: customer?.directorName || '',
      legalAddress: customer?.legalAddress || '',
      organizationType: customer?.organizationType || '',
    });
  }, [customer]);

  const handleSave = async () => {
    if (!form.name.trim()) { showToast?.('Имя не может быть пустым'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      onCustomerUpdate?.(updated);
      setEditing(false);
      showToast?.('Профиль сохранён');
    } catch {
      showToast?.('Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      companyBin: customer?.companyBin || '',
      companyName: customer?.companyName || '',
      directorName: customer?.directorName || '',
      legalAddress: customer?.legalAddress || '',
      organizationType: customer?.organizationType || '',
    });
    setEditing(false);
  };

  const handleSendCode = async () => {
    if (!customer?.email) return;
    setSendingCode(true);
    try {
      await forgotPassword(customer.email);
      setCodeSent(true);
      showToast?.('Код подтверждения отправлен на вашу почту!');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Не удалось отправить код подтверждения';
      showToast?.(errMsg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSavePassword = async () => {
    if (!pwdForm.code) {
      showToast?.('Укажите код из письма');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      showToast?.('Новый пароль должен содержать не менее 6 символов');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showToast?.('Пароли не совпадают');
      return;
    }

    setSavingPwd(true);
    try {
      await resetPassword(customer.email, pwdForm.code, pwdForm.newPassword);
      showToast?.('Пароль успешно изменён');
      setPwdForm({ code: '', newPassword: '', confirmPassword: '' });
      setCodeSent(false);
      setChangingPassword(false);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Не удалось изменить пароль';
      showToast?.(errMsg);
    } finally {
      setSavingPwd(false);
    }
  };

  const handleCancelPassword = () => {
    setPwdForm({ code: '', newPassword: '', confirmPassword: '' });
    setCodeSent(false);
    setChangingPassword(false);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Left info block */}
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
              <User className="h-7 w-7 text-slate-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate leading-tight">
                {customer?.entityType === 'LEGAL' && customer?.companyName 
                  ? customer.companyName 
                  : (customer?.name || 'Покупатель')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold truncate mt-0.5">{customer?.email}</p>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 whitespace-nowrap">
                  {customer?.entityType === 'LEGAL' ? (
                    <>
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span>Юридическое лицо</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 shrink-0" />
                      <span>Физическое лицо</span>
                    </>
                  )}
                </span>
                {customer?.role && customer.role !== 'CUSTOMER' && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 whitespace-nowrap">
                    <ShieldCheck className="h-3 w-3" />
                    {customer.role === 'ADMIN' ? 'Админ' : customer.role}
                  </span>
                )}
                {bonuses && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 whitespace-nowrap">
                    <Gift className="h-3 w-3 animate-pulse" />
                    {formatPrice(bonuses.availableBalance ?? 0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right actions block */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto border-t border-slate-100/70 pt-4 sm:border-0 sm:pt-0">
            {(customer?.role === 'SUPPLIER' || customer?.role === 'ADMIN') && (
              <a
                href={
                  typeof window !== 'undefined' &&
                    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? 'http://localhost:3001'
                    : 'https://cabinet.tormag.kz'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto justify-center inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition-all shadow-md whitespace-nowrap text-center cursor-pointer"
              >
                Панель управления
              </a>
            )}
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full sm:w-auto justify-center flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                Редактировать
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm space-y-5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {customer?.entityType === 'LEGAL' ? 'Данные организации' : 'Личные данные'}
        </h3>

        {/* Legal entity specific profile fields */}
        {customer?.entityType === 'LEGAL' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">БИН или ИИН</label>
              {editing ? (
                <input type="text" value={form.companyBin} onChange={e => setForm(f => ({ ...f, companyBin: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-800">
                  {customer?.companyBin || '—'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Наименование организации</label>
              {editing ? (
                <input type="text" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-800">
                  {customer?.companyName || '—'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ФИО руководителя</label>
              {editing ? (
                <input type="text" value={form.directorName} onChange={e => setForm(f => ({ ...f, directorName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-800">
                  {customer?.directorName || '—'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Тип организации</label>
              {editing ? (
                <select value={form.organizationType} onChange={e => setForm(f => ({ ...f, organizationType: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition">
                  <option value="ТОО">ТОО</option>
                  <option value="ИП">ИП</option>
                  <option value="АО">АО</option>
                </select>
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-800">
                  {customer?.organizationType || '—'}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Юридический адрес</label>
              {editing ? (
                <input type="text" value={form.legalAddress} onChange={e => setForm(f => ({ ...f, legalAddress: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-800">
                  {customer?.legalAddress || '—'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {customer?.entityType === 'LEGAL' ? 'ФИО контактного лица' : 'Имя'}
          </label>
          {editing ? (
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              placeholder="Ваше имя" />
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <User className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-800">{customer?.name || '—'}</span>
            </div>
          )}
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email (нельзя изменить)</label>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-800">{customer?.email || '—'}</span>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Телефон</label>
          {editing ? (
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              placeholder="+7 (___) ___-__-__" />
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-800">{customer?.phone || 'Не указан'}</span>
            </div>
          )}
        </div>

        {editing && (
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" onClick={handleCancel}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
              <X className="h-4 w-4" />
              Отмена
            </button>
          </div>
        )}
      </div>

      {/* User Addresses Card */}
      <UserAddressesSection
        customer={customer}
        showToast={showToast}
        onCustomerUpdate={onCustomerUpdate}
      />

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900">Безопасность</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Смена пароля (требуется код подтверждения)</p>
            </div>
          </div>
          {!changingPassword && (
            <button
              type="button"
              onClick={() => setChangingPassword(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/70 hover:border-blue-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Изменить пароль
            </button>
          )}
        </div>

        {changingPassword && (
          <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
            {!codeSent ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Для смены пароля мы отправим одноразовый код подтверждения на ваш email: <strong className="text-slate-900">{customer?.email}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {sendingCode ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {sendingCode ? 'Отправка...' : 'Получить код на email'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Code field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Код подтверждения из письма</label>
                  <input
                    type="text"
                    value={pwdForm.code}
                    onChange={e => setPwdForm(p => ({ ...p, code: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950/30 focus:border-slate-950 transition"
                    placeholder="Введите 6-значный код"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Новый пароль</label>
                  <input
                    type="password"
                    value={pwdForm.newPassword}
                    onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950/30 focus:border-slate-950 transition"
                    placeholder="Минимум 6 символов"
                  />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Подтверждение нового пароля</label>
                  <input
                    type="password"
                    value={pwdForm.confirmPassword}
                    onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950/30 focus:border-slate-950 transition"
                    placeholder="Повторите новый пароль"
                  />
                </div>

                {/* Password Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSavePassword}
                    disabled={savingPwd}
                    className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {savingPwd ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {savingPwd ? 'Сохранение...' : 'Обновить пароль'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-0 p-0 ml-auto cursor-pointer"
                  >
                    Отправить код повторно
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'orders', label: 'Заказы', icon: ClipboardList },
  { id: 'promotions', label: 'Промокоды', icon: Tag },
];

// ─── Cabinet ──────────────────────────────────────────────────────────────────
export default function Cabinet({
  customer,
  orders,
  ordersLoading,
  ordersHasMore,
  ordersTotal,
  onRefreshOrders,
  onLoadMoreOrders,
  bonuses,
  onNavigate,
  onOpenAuth,
  handleLogout,
  showToast,
  onCustomerUpdate,
  onAddToCart,
  initialTab,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Switch tab and update browser URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const path = CABINET_TAB_PATHS[tabId] || 'cabinet';
    window.history.pushState({}, '', `/${path}`);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (!customer) {
    return (
      <div className="mx-auto max-w-xl my-8 sm:my-16 p-8 sm:p-12 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-xl text-center space-y-7 animate-fade-in-up relative overflow-hidden">
        {/* Badge Icon */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10 mx-auto">
          <User className="h-10 w-10 stroke-[2.2]" />
        </div>

        <div className="space-y-2.5">
          <h1 className="font-outfit text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Личный кабинет
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            Для просмотра истории заказов, использования бонусов и управления профилем необходимо авторизоваться.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl transition-all duration-200 text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 border border-emerald-500/30 cursor-pointer"
          >
            <User className="h-4 w-4 shrink-0" />
            <span>Войти в аккаунт</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit tracking-tight truncate">Личный кабинет</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">Управляйте профилем, заказами и бонусами</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="group flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50/50 border border-slate-250 hover:border-rose-200/80 px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow shrink-0"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
          <span>Выйти</span>
        </button>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-3 gap-1 bg-slate-50/50 border border-slate-200/60 rounded-xl p-1 shadow-sm">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center justify-center gap-1 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
                }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <ProfileTab
          customer={customer}
          showToast={showToast}
          onCustomerUpdate={onCustomerUpdate}
          bonuses={bonuses}
        />
      )}

      {activeTab === 'orders' && (
        <MyOrders
          customer={customer}
          orders={orders}
          loading={ordersLoading}
          hasMore={ordersHasMore}
          total={ordersTotal}
          onRefresh={onRefreshOrders}
          onLoadMore={onLoadMoreOrders}
          onOpenAuth={onOpenAuth}
          onNavigate={onNavigate}
          onAddToCart={onAddToCart}
          showToast={showToast}
          bonuses={bonuses}
        />
      )}

      {activeTab === 'promotions' && (
        <MyPromotions
          customer={customer}
          onOpenAuth={onOpenAuth}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      )}
    </section>
  );
}
