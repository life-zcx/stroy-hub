import { useState, useCallback, useEffect } from 'react';
import { getBonusSummary, getBonusHistory } from '../services/api';

export default function useBonuses(customer) {
  const [summary, setSummary] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    availableBonusPoints: 0,
  });
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);

  const fetchSummary = useCallback(async () => {
    if (!customer) {
      setSummary({ availableBalance: 0, pendingBalance: 0, totalEarned: 0, totalSpent: 0, availableBonusPoints: 0 });
      return;
    }
    setSummaryLoading(true);
    try {
      const data = await getBonusSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching bonus summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    fetchSummary();
  }, [customer, fetchSummary]);

  const fetchHistory = useCallback(async ({ page = 1, append = false } = {}) => {
    if (!customer) return;
    setHistoryLoading(true);
    try {
      const data = await getBonusHistory({ page, limit: 20 });
      const transactions = data.data || [];
      setHistory((prev) => append ? [...prev, ...transactions] : transactions);
      setHistoryPage(page);
      setHistoryHasMore(Boolean(data.hasMore));
      setHistoryTotal(data.total || transactions.length);
    } catch (error) {
      console.error('Error fetching bonus history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [customer]);

  const loadMoreHistory = () => fetchHistory({ page: historyPage + 1, append: true });

  return {
    // Summary данные
    availableBalance: summary.availableBalance,
    pendingBalance: summary.pendingBalance,
    totalEarned: summary.totalEarned,
    totalSpent: summary.totalSpent,
    availableBonusPoints: summary.availableBalance, // backward compat
    loyalty: summary.loyalty,
    summaryLoading,

    // История транзакций
    history,
    historyLoading,
    historyHasMore,
    historyTotal,

    // Методы
    fetchSummary,
    fetchHistory,
    loadMoreHistory,
  };
}
