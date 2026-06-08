import { useEffect, useState } from 'react';
import { getProfile, login, logout, register, forgotPassword, resetPassword, sendRegisterCode } from '../services/api';

export default function useCustomerAuth(showToast) {
  const [customer, setCustomer] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // login, register, forgot, reset, register-confirm
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authResetCode, setAuthResetCode] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handlePhoneChange = (value) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '');
    
    if (!cleaned) {
      setAuthPhone('');
      return;
    }

    let formatted = '+7 ';
    let digits = cleaned;
    
    if (digits.startsWith('7') || digits.startsWith('8')) {
      digits = digits.substring(1);
    }
    
    digits = digits.substring(0, 10);

    if (digits.length > 0) {
      formatted += '(' + digits.substring(0, 3);
    }
    if (digits.length >= 3) {
      formatted += ') ';
    }
    if (digits.length > 3) {
      formatted += digits.substring(3, 6);
    }
    if (digits.length >= 6) {
      formatted += '-' + digits.substring(6, 8);
    }
    if (digits.length >= 8) {
      formatted += '-' + digits.substring(8, 10);
    }

    setAuthPhone(formatted);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authTab === 'reset') {
        await forgotPassword(authEmail);
        showToast?.('✉️ Код подтверждения отправлен повторно!');
        setResendCooldown(60);
      } else if (authTab === 'register-confirm') {
        const payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          address: authAddress,
        };
        await sendRegisterCode(payload);
        showToast?.('✉️ Код подтверждения отправлен повторно!');
        setResendCooldown(60);
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message || 'Ошибка при повторной отправке');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const checkCustomerAuth = async () => {
      try {
        const profile = await getProfile();
        setCustomer(profile);
      } catch (error) {
        setCustomer(null);
      } finally {
        setIsAuthChecking(false);
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
        setCustomer(data.user);
        showToast?.(`👋 Добро пожаловать, ${data.user.name || 'Покупатель'}!`);
        setAuthModalOpen(false);
        resetAuthForm();
      } else if (authTab === 'register') {
        // Validate inputs first
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(authEmail)) {
          setAuthError('Неверный формат электронной почты');
          return;
        }

        const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
        if (!phoneRegex.test(authPhone)) {
          setAuthError('Формат телефона должен быть +7 (707) 123-45-67');
          return;
        }

        if (authPassword.length < 6) {
          setAuthError('Пароль должен быть не менее 6 символов');
          return;
        }

        if (!authName.trim()) {
          setAuthError('Пожалуйста, введите ваше имя');
          return;
        }

        const payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          address: authAddress,
        };
        await sendRegisterCode(payload);
        showToast?.('✉️ Код подтверждения отправлен на вашу почту!');
        setResendCooldown(60);
        setAuthTab('register-confirm');
      } else if (authTab === 'register-confirm') {
        const payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          address: authAddress,
          code: authResetCode,
        };
        const data = await register(payload);
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
    logout().catch(() => {});
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
    handlePhoneChange,
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
    isAuthChecking,
  };
}
