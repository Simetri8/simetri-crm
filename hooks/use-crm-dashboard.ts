'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/lib/firebase/dashboard';
import type {
  DashboardKPIs,
  FollowUpItem,
  NetworkingItem,
  RequestSummaryItem,
  PipelineStageSummary,
} from '@/lib/types';

export type CrmDashboardData = {
  kpis: DashboardKPIs | null;
  followUps: FollowUpItem[];
  networkingContacts: NetworkingItem[];
  openRequests: RequestSummaryItem[];
  pipelineSummary: PipelineStageSummary[];
  oldestOverdueDays: number | null;
};

export function useCrmDashboard() {
  const [data, setData] = useState<CrmDashboardData>({
    kpis: null,
    followUps: [],
    networkingContacts: [],
    openRequests: [],
    pipelineSummary: [],
    oldestOverdueDays: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpis, followUps, networkingContacts, openRequests, pipelineSummary, oldestOverdueDays] =
        await Promise.all([
          dashboardService.getKPIs(),
          dashboardService.getFollowUps({ limitCount: 10 }),
          dashboardService.getNetworkingContacts({ limitCount: 10 }),
          dashboardService.getOpenRequests({ limitCount: 10 }),
          dashboardService.getPipelineSummary(),
          dashboardService.getOldestOverdueDays(),
        ]);

      setData({ kpis, followUps, networkingContacts, openRequests, pipelineSummary, oldestOverdueDays });
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
