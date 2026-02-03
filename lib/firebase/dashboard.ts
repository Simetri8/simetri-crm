'use client';

import { companyService } from './companies';
import { dealService } from './deals';
import { workOrderService } from './work-orders';
import { timeEntryService } from './time-entries';
import type {
  DashboardKPIs,
  FollowUpItem,
  PipelineStageSummary,
  WorkOrderRiskItem,
  TimesheetQueueItem,
  Company,
  Deal,
} from '@/lib/types';

/**
 * Dashboard verileri icin merkezi servis
 */
export const dashboardService = {
  /**
   * KPI degerlerini getirir
   */
  getKPIs: async (): Promise<DashboardKPIs> => {
    const [
      overdueCompanies,
      overdueDeals,
      todayCompanies,
      todayDeals,
      activeWorkOrders,
      pendingTimesheets,
    ] = await Promise.all([
      companyService.getOverdueFollowUps({ limitCount: 100 }),
      dealService.getOverdueFollowUps({ limitCount: 100 }),
      companyService.getTodayFollowUps({ limitCount: 100 }),
      dealService.getTodayFollowUps({ limitCount: 100 }),
      workOrderService.getActive({ limitCount: 100 }),
      timeEntryService.getPendingApproval({ limitCount: 100 }),
    ]);

    return {
      overdueNextActions: overdueCompanies.length + overdueDeals.length,
      todayNextActions: todayCompanies.length + todayDeals.length,
      openWorkOrders: activeWorkOrders.length,
      pendingTimesheets: pendingTimesheets.length,
    };
  },

  /**
   * Bugunku ve geciken takipleri getirir
   */
  getFollowUps: async (options?: {
    limitCount?: number;
  }): Promise<FollowUpItem[]> => {
    const limitPerType = options?.limitCount ? Math.ceil(options.limitCount / 2) : 10;

    const [overdueCompanies, overdueDeals, todayCompanies, todayDeals] =
      await Promise.all([
        companyService.getOverdueFollowUps({ limitCount: limitPerType }),
        dealService.getOverdueFollowUps({ limitCount: limitPerType }),
        companyService.getTodayFollowUps({ limitCount: limitPerType }),
        dealService.getTodayFollowUps({ limitCount: limitPerType }),
      ]);

    const mapCompanyToFollowUp = (company: Company, isOverdue: boolean): FollowUpItem => ({
      type: 'company',
      id: company.id,
      title: company.name,
      nextAction: company.nextAction,
      nextActionDate: company.nextActionDate,
      ownerId: company.ownerId,
      ownerName: null, // TODO: denormalize edilebilir
      lastActivityAt: company.lastActivityAt,
      isOverdue,
    });

    const mapDealToFollowUp = (deal: Deal, isOverdue: boolean): FollowUpItem => ({
      type: 'deal',
      id: deal.id,
      title: deal.title,
      nextAction: deal.nextAction,
      nextActionDate: deal.nextActionDate,
      ownerId: deal.ownerId,
      ownerName: null, // TODO: denormalize edilebilir
      lastActivityAt: deal.lastActivityAt,
      isOverdue,
    });

    const followUps: FollowUpItem[] = [
      ...overdueCompanies.map((c) => mapCompanyToFollowUp(c, true)),
      ...overdueDeals.map((d) => mapDealToFollowUp(d, true)),
      ...todayCompanies.map((c) => mapCompanyToFollowUp(c, false)),
      ...todayDeals.map((d) => mapDealToFollowUp(d, false)),
    ];

    // Gecikenleri onde, sonra tarihe gore sirala
    followUps.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }
      const dateA = a.nextActionDate?.toMillis() ?? 0;
      const dateB = b.nextActionDate?.toMillis() ?? 0;
      return dateA - dateB;
    });

    return options?.limitCount ? followUps.slice(0, options.limitCount) : followUps;
  },

  /**
   * Pipeline ozet istatistiklerini getirir
   */
  getPipelineSummary: async (): Promise<PipelineStageSummary[]> => {
    return dealService.getPipelineSummary();
  },

  /**
   * Riskli is emirlerini getirir
   */
  getRiskyWorkOrders: async (options?: {
    limitCount?: number;
  }): Promise<WorkOrderRiskItem[]> => {
    return workOrderService.getRiskyWorkOrders(options);
  },

  /**
   * Onay bekleyen timesheet'leri getirir
   */
  getTimesheetQueue: async (options?: {
    limitCount?: number;
  }): Promise<TimesheetQueueItem[]> => {
    return timeEntryService.getPendingApproval(options);
  },

  /**
   * En eski geciken takibin kac gun once oldugunu hesaplar
   */
  getOldestOverdueDays: async (): Promise<number | null> => {
    const [companies, deals] = await Promise.all([
      companyService.getOverdueFollowUps({ limitCount: 1 }),
      dealService.getOverdueFollowUps({ limitCount: 1 }),
    ]);

    const oldestDates: number[] = [];
    if (companies[0]?.nextActionDate) {
      oldestDates.push(companies[0].nextActionDate.toMillis());
    }
    if (deals[0]?.nextActionDate) {
      oldestDates.push(deals[0].nextActionDate.toMillis());
    }

    if (oldestDates.length === 0) return null;

    const oldestMs = Math.min(...oldestDates);
    const now = Date.now();
    const diffDays = Math.floor((now - oldestMs) / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Bu hafta teslim edilecek is emirlerinin sayisini getirir
   */
  getThisWeekDeliveryCount: async (): Promise<number> => {
    const workOrders = await workOrderService.getRiskyWorkOrders({ limitCount: 50 });
    return workOrders.filter((wo) => wo.isDueSoon && !wo.isOverdue).length;
  },
};
