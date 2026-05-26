import { useState } from 'react';
import { getOrders } from '../services/api';

export default function useOrders(customer, showToast) {
  const [orders, setOrders] = useState([]);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchMyOrders = async () => {
    if (!customer) return;
    setOrdersLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
      setOrdersModalOpen(true);
    } catch (error) {
      console.error(error);
      showToast?.('⚠️ Не удалось загрузить историю заказов');
    } finally {
      setOrdersLoading(false);
    }
  };

  const clearOrders = () => {
    setOrders([]);
  };

  return {
    orders,
    ordersModalOpen,
    setOrdersModalOpen,
    ordersLoading,
    fetchMyOrders,
    clearOrders,
  };
}
