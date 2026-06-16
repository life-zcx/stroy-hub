import React, { useState, useEffect } from 'react';
import {
  User, ClipboardList, Tag, LogOut, Edit3, Check, X,
  Phone, Mail, MapPin, RefreshCw, ShieldCheck, Lock, Gift,
} from 'lucide-react';
import { updateProfile, forgotPassword, resetPassword } from '../services/api';
import { CABINET_TAB_PATHS } from '../hooks/useNavigation';
import MyOrders from './MyOrders';
import MyPromotions from './MyPromotions';
import { formatPrice } from '../utils/formatPrice';

// ─── Profile edit tab ─────────────────────────────────────────────────────────
function ProfileTab({ customer, showToast, onCustomerUpdate, bonuses }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:    customer?.name    || '',
    phone:   customer?.phone   || '',
    address: customer?.address || '',
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
    setForm({ name: customer?.name||'', phone: customer?.phone||'', address: customer?.address||'' });
  }, [customer]);

  const handleSave = async () => {
    if (!form.name.trim()) { showToast?.('❌ Имя не может быть пустым'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      onCustomerUpdate?.(updated);
      setEditing(false);
      showToast?.('✅ Профиль сохранён');
    } catch {
      showToast?.('❌ Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: customer?.name||'', phone: customer?.phone||'', address: customer?.address||'' });
    setEditing(false);
  };

  const handleSendCode = async () => {
    if (!customer?.email) return;
    setSendingCode(true);
    try {
      await forgotPassword(customer.email);
      setCodeSent(true);
      showToast?.('✉️ Код подтверждения отправлен на вашу почту!');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Не удалось отправить код подтверждения';
      showToast?.(`❌ ${errMsg}`);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSavePassword = async () => {
    if (!pwdForm.code) {
      showToast?.('❌ Укажите код из письма');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      showToast?.('❌ Новый пароль должен содержать не менее 6 символов');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showToast?.('❌ Пароли не совпадают');
      return;
    }

    setSavingPwd(true);
    try {
      await resetPassword(customer.email, pwdForm.code, pwdForm.newPassword);
      showToast?.('✅ Пароль успешно изменён');
      setPwdForm({ code: '', newPassword: '', confirmPassword: '' });
      setCodeSent(false);
      setChangingPassword(false);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Не удалось изменить пароль';
      showToast?.(`❌ ${errMsg}`);
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
              <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate leading-tight">{customer?.name || 'Покупатель'}</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold truncate mt-0.5">{customer?.email}</p>
              
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
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
          <div className="flex flex-row sm:flex-col items-stretch sm:items-end gap-2 border-t border-slate-100/70 pt-4 sm:border-0 sm:pt-0">
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
                className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100 whitespace-nowrap text-center cursor-pointer"
              >
                Панель управления
              </a>
            )}
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer"
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
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Личные данные</h3>

        {/* Name */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Имя</label>
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

        {/* Address */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Адрес доставки</label>
          {editing ? (
            <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              rows={2} placeholder="г. Алматы, ул. ..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition resize-none" />
          ) : (
            <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-slate-800">{customer?.address || 'Не указан'}</span>
            </div>
          )}
        </div>

        {editing && (
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md">
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

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900">Безопасность</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Смена пароля с подтверждением через email</p>
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
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  {sendingCode ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {sendingCode ? 'Отправка...' : 'Получить код на email'}
                </button>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                    placeholder="Повторите новый пароль"
                  />
                </div>

                {/* Password Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSavePassword}
                    disabled={savingPwd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
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
  { id: 'profile',    label: 'Профиль',    icon: User },
  { id: 'orders',     label: 'Мои заказы', icon: ClipboardList },
  { id: 'promotions', label: 'Промокоды',  icon: Tag },
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
      <section className="max-w-md mx-auto py-20 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
          <User className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Войдите в аккаунт</h2>
          <p className="text-sm text-slate-500 mb-6">Для доступа к личному кабинету необходимо авторизоваться.</p>
          <button type="button" onClick={onOpenAuth}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl text-sm uppercase tracking-wider transition-all">
            Войти
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-outfit">Личный кабинет</h1>
          <p className="text-sm text-slate-500 mt-0.5">Управляйте профилем, заказами и бонусами</p>
        </div>
        <button type="button" onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 px-4 py-2.5 rounded-xl transition-all">
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white border border-slate-200/70 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
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
