'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/lib/firebase/dashboard';
import type { Activity, DashboardKPIs } from '@/lib/types';

export type OverviewDashboardData = {
  kpis: DashboardKPIs | null;
  oldestOverdueDays: number | null;
  thisWeekDeliveryCount: number;
  recentActivities: Activity[];
};

export function useOverviewDashboard() {
  const [data, setData] = useState<OverviewDashboardData>({
    kpis: null,
    oldestOverdueDays: null,
    thisWeekDeliveryCount: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpis, oldestOverdueDays, thisWeekDeliveryCount, recentActivities] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getOldestOverdueDays(),
        dashboardService.getThisWeekDeliveryCount(),
        dashboardService.getRecentActivities({ limitCount: 8 }),
      ]);

      setData({ kpis, oldestOverdueDays, thisWeekDeliveryCount, recentActivities });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Veri yuklenirken hata olustu'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
