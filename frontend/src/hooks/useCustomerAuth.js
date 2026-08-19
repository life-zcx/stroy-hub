import { useEffect, useState } from 'react';
import { getProfile, login, logout, register, forgotPassword, verifyResetCode, resetPassword, sendRegisterCode } from '../services/api';
import { getFriendlyErrorMessage } from '../utils/errorHelper';
import { getAnalyticsSessionId } from '../utils/analytics';

export default function useCustomerAuth(showToast) {
  const [customer, setCustomer] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // login, register, forgot, reset, register-confirm
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [entityType, setEntityType] = useState('PHYSICAL'); // 'PHYSICAL' | 'LEGAL'
  const [companyBin, setCompanyBin] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [organizationType, setOrganizationType] = useState('');
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
      if (authTab === 'reset-code' || authTab === 'reset-password' || authTab === 'reset') {
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
          entityType,
          companyBin: entityType === 'LEGAL' ? companyBin : null,
          companyName: entityType === 'LEGAL' ? companyName : null,
          directorName: entityType === 'LEGAL' ? directorName : null,
          legalAddress: entityType === 'LEGAL' ? legalAddress : null,
          organizationType: entityType === 'LEGAL' ? organizationType : null,
        };
        await sendRegisterCode(payload);
        showToast?.('✉️ Код подтверждения отправлен повторно!');
        setResendCooldown(60);
      }
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
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
    setAuthConfirmPassword('');
    setAuthName('');
    setAuthPhone('');
    setAuthAddress('');
    setEntityType('PHYSICAL');
    setCompanyBin('');
    setCompanyName('');
    setDirectorName('');
    setLegalAddress('');
    setOrganizationType('');
    setAuthResetCode('');
    setAuthError(null);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authTab === 'login') {
        const data = await login(authEmail, authPassword, getAnalyticsSessionId());
        setCustomer(data.user);
        showToast?.(`Добро пожаловать, ${data.user.name || 'Покупатель'}!`);
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

        if (entityType === 'LEGAL') {
          const binClean = companyBin.replace(/\D/g, '');
          if (!binClean || binClean.length !== 12) {
            setAuthError('БИН или ИИН компании должен состоять из 12 цифр');
            return;
          }
          if (!companyName.trim()) {
            setAuthError('Введите наименование организации');
            return;
          }
          if (!directorName.trim()) {
            setAuthError('Введите ФИО руководителя');
            return;
          }
          if (!legalAddress.trim()) {
            setAuthError('Введите юридический адрес');
            return;
          }
          if (!organizationType.trim()) {
            setAuthError('Выберите тип организации');
            return;
          }
        }

        const payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          address: authAddress,
          entityType,
          companyBin: entityType === 'LEGAL' ? companyBin : null,
          companyName: entityType === 'LEGAL' ? companyName : null,
          directorName: entityType === 'LEGAL' ? directorName : null,
          legalAddress: entityType === 'LEGAL' ? legalAddress : null,
          organizationType: entityType === 'LEGAL' ? organizationType : null,
        };
        await sendRegisterCode(payload);
        showToast?.('✉️ Код подтверждения отправлен на вашу почту!');
        setResendCooldown(60);
        setAuthTab('register-confirm');
      } else if (authTab === 'register-confirm') {
        const storedRefCode = typeof window !== 'undefined' ? localStorage.getItem('tormag_referral_code') : null;
        const payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          address: authAddress,
          entityType,
          companyBin: entityType === 'LEGAL' ? companyBin : null,
          companyName: entityType === 'LEGAL' ? companyName : null,
          directorName: entityType === 'LEGAL' ? directorName : null,
          legalAddress: entityType === 'LEGAL' ? legalAddress : null,
          organizationType: entityType === 'LEGAL' ? organizationType : null,
          code: authResetCode,
          referralCode: storedRefCode || undefined,
          sessionId: getAnalyticsSessionId(),
        };
        const data = await register(payload);
        setCustomer(data.user);
        showToast?.('🎉 Регистрация успешно завершена!');
        setAuthModalOpen(false);
        resetAuthForm();
      } else if (authTab === 'forgot') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(authEmail)) {
          setAuthError('Неверный формат электронной почты');
          return;
        }
        await forgotPassword(authEmail);
        showToast?.('✉️ Код подтверждения отправлен на вашу почту!');
        setResendCooldown(60);
        setAuthTab('reset-code');
      } else if (authTab === 'reset-code') {
        const cleanCode = authResetCode.replace(/\D/g, '');
        if (!cleanCode || cleanCode.length !== 6) {
          setAuthError('Укажите 6-значный код подтверждения из письма');
          return;
        }
        await verifyResetCode(authEmail, cleanCode);
        setAuthTab('reset-password');
      } else if (authTab === 'reset-password' || authTab === 'reset') {
        if (authPassword.length < 6) {
          setAuthError('Новый пароль должен содержать не менее 6 символов');
          return;
        }
        if (!authConfirmPassword) {
          setAuthError('Пожалуйста, подтвердите новый пароль');
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setAuthError('Пароли не совпадают');
          return;
        }
        await resetPassword(authEmail, authResetCode, authPassword);
        showToast?.('🔑 Пароль успешно изменен! Войдите с новым паролем.');
        setAuthTab('login');
        resetAuthForm();
      }
    } catch (err) {
      console.error(err);
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout().catch(() => {});
    setCustomer(null);
    showToast?.('Вы успешно вышли из профиля');
  };

  const openLoginModal = () => {
    setAuthTab('login');
    setAuthModalOpen(true);
  };

  return {
    customer,
    setCustomer,
    authModalOpen,
    setAuthModalOpen,
    authTab,
    setAuthTab,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authConfirmPassword,
    setAuthConfirmPassword,
    authName,
    setAuthName,
    authPhone,
    setAuthPhone,
    handlePhoneChange,
    authAddress,
    setAuthAddress,
    entityType,
    setEntityType,
    companyBin,
    setCompanyBin,
    companyName,
    setCompanyName,
    directorName,
    setDirectorName,
    legalAddress,
    setLegalAddress,
    organizationType,
    setOrganizationType,
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
