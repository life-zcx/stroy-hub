import { useState } from 'react';
import { getOrderById, getOrders } from '../services/api';

const ORDERS_PAGE_SIZE = 20;

export default function useOrders(customer, showToast) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersTotal, setOrdersTotal] = useState(0);

  const fetchMyOrders = async ({ page = 1, append = false } = {}) => {
    if (!customer) return;
    setOrdersLoading(true);
    try {
      const result = await getOrders({ page, limit: ORDERS_PAGE_SIZE, summary: true });
      const loadedOrders = Array.isArray(result) ? result : (result.data || []);

      setOrders((prev) => {
        if (!append) return loadedOrders;

        const existingIds = new Set(prev.map((order) => order.id));
        return [...prev, ...loadedOrders.filter((order) => !existingIds.has(order.id))];
      });
      setOrdersPage(page);
      setOrdersHasMore(Boolean(result.hasMore));
      setOrdersTotal(result.total || loadedOrders.length);
      return result;
    } catch (error) {
      console.error(error);
      showToast?.('Не удалось загрузить историю заказов');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadMoreOrders = () => fetchMyOrders({ page: ordersPage + 1, append: true });

  const fetchOrderDetails = async (orderId) => {
    if (!customer || !orderId) return null;
    setOrderDetailsLoading(true);
    setOrderDetailsError('');
    try {
      const order = await getOrderById(orderId);
      setOrders((prev) => {
        const exists = prev.some((item) => String(item.id) === String(order.id));
        if (!exists) return [order, ...prev];
        return prev.map((item) => String(item.id) === String(order.id) ? order : item);
      });
      return order;
    } catch (error) {
      console.error(error);
      setOrderDetailsError(error.response?.data?.error || 'Не удалось загрузить заказ');
      showToast?.('Не удалось загрузить заказ');
      return null;
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const clearOrders = () => {
    setOrders([]);
    setOrdersPage(1);
    setOrdersHasMore(false);
    setOrdersTotal(0);
    setOrderDetailsError('');
  };

  return {
    orders,
    ordersLoading,
    orderDetailsLoading,
    orderDetailsError,
    ordersHasMore,
    ordersTotal,
    fetchMyOrders,
    loadMoreOrders,
    fetchOrderDetails,
    clearOrders,
  };
}
