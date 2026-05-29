import { useEffect, useState } from 'react';
import { getProfile, login, register, forgotPassword, resetPassword } from '../services/api';

export default function useCustomerAuth(showToast) {
  const [customer, setCustomer] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // login, register, forgot, reset
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authResetCode, setAuthResetCode] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0 || authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await forgotPassword(authEmail);
      showToast?.('✉️ Код подтверждения отправлен повторно!');
      setResendCooldown(60);
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message || 'Ошибка при повторной отправке');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const checkCustomerAuth = async () => {
      const token = localStorage.getItem('tormag_customer_token');
      if (token) {
        try {
          const profile = await getProfile();
          setCustomer(profile);
        } catch (error) {
          console.error('Invalid customer token:', error);
          localStorage.removeItem('tormag_customer_token');
        }
      }
    };

    checkCustomerAuth();
  }, []);

  const resetAuthForm = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthPhone('');
    setAuthAddress('');
    setAuthResetCode('');
    setAuthError(null);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authTab === 'login') {
        const data = await login(authEmail, authPassword);
        localStorage.setItem('tormag_customer_token', data.token);
        setCustomer(data.user);
        showToast?.(`👋 Добро пожаловать, ${data.user.name || 'Покупатель'}!`);
        setAuthModalOpen(false);
        resetAuthForm();
      } else if (authTab === 'register') {
        const payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          address: authAddress,
          role: 'CUSTOMER',
        };
        const data = await register(payload);
        localStorage.setItem('tormag_customer_token', data.token);
        setCustomer(data.user);
        showToast?.('🎉 Регистрация успешно завершена!');
        setAuthModalOpen(false);
        resetAuthForm();
      } else if (authTab === 'forgot') {
        await forgotPassword(authEmail);
        showToast?.('✉️ Код подтверждения отправлен на вашу почту!');
        setResendCooldown(60);
        setAuthTab('reset');
      } else if (authTab === 'reset') {
        await resetPassword(authEmail, authResetCode, authPassword);
        showToast?.('🔑 Пароль успешно изменен! Войдите с новым паролем.');
        setAuthTab('login');
        setAuthPassword('');
        setAuthResetCode('');
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.response?.data?.error || err.message || 'Ошибка');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tormag_customer_token');
    setCustomer(null);
    showToast?.('🚪 Вы успешно вышли из профиля.');
  };

  const openLoginModal = () => {
    setAuthTab('login');
    setAuthModalOpen(true);
  };

  return {
    customer,
    authModalOpen,
    setAuthModalOpen,
    authTab,
    setAuthTab,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authName,
    setAuthName,
    authPhone,
    setAuthPhone,
    authAddress,
    setAuthAddress,
    authResetCode,
    setAuthResetCode,
    authError,
    setAuthError,
    authLoading,
    resendCooldown,
    handleResendCode,
    handleAuthSubmit,
    handleLogout,
    openLoginModal,
  };
}
