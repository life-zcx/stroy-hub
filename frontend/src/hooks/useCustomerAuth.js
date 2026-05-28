import { useEffect, useState } from 'react';
import { getProfile, login, register } from '../services/api';

export default function useCustomerAuth(showToast) {
  const [customer, setCustomer] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

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
      } else {
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
      }
      setAuthModalOpen(false);
      resetAuthForm();
    } catch (err) {
      console.error(err);
      setAuthError(err.response?.data?.error || err.message || 'Ошибка входа');
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
    authError,
    setAuthError,
    authLoading,
    handleAuthSubmit,
    handleLogout,
    openLoginModal,
  };
}
