'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/lib/firebase/dashboard';
import type {
  DashboardKPIs,
  FollowUpItem,
  PipelineStageSummary,
  WorkOrderRiskItem,
  TimesheetQueueItem,
} from '@/lib/types';

export type DashboardData = {
  kpis: DashboardKPIs | null;
  followUps: FollowUpItem[];
  pipelineSummary: PipelineStageSummary[];
  workOrderRisks: WorkOrderRiskItem[];
  timesheetQueue: TimesheetQueueItem[];
  oldestOverdueDays: number | null;
  thisWeekDeliveryCount: number;
};

export type UseDashboardReturn = {
  data: DashboardData;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const initialData: DashboardData = {
  kpis: null,
  followUps: [],
  pipelineSummary: [],
  workOrderRisks: [],
  timesheetQueue: [],
  oldestOverdueDays: null,
  thisWeekDeliveryCount: 0,
};

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        kpis,
        followUps,
        pipelineSummary,
        workOrderRisks,
        timesheetQueue,
        oldestOverdueDays,
        thisWeekDeliveryCount,
      ] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getFollowUps({ limitCount: 10 }),
        dashboardService.getPipelineSummary(),
        dashboardService.getRiskyWorkOrders({ limitCount: 10 }),
        dashboardService.getTimesheetQueue({ limitCount: 10 }),
        dashboardService.getOldestOverdueDays(),
        dashboardService.getThisWeekDeliveryCount(),
      ]);

      setData({
        kpis,
        followUps,
        pipelineSummary,
        workOrderRisks,
        timesheetQueue,
        oldestOverdueDays,
        thisWeekDeliveryCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Veri yuklenirken hata olustu'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}
