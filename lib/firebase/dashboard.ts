'use client';

import { companyService } from './companies';
import { contactService } from './contacts';
import { dealService } from './deals';
import { requestService } from './requests';
import { workOrderService } from './work-orders';
import { timeEntryService } from './time-entries';
import type {
  DashboardKPIs,
  FollowUpItem,
  NetworkingItem,
  RequestSummaryItem,
  PipelineStageSummary,
  WorkOrderRiskItem,
  TimesheetQueueItem,
  Company,
  Contact,
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
      overdueContacts,
      todayCompanies,
      todayDeals,
      todayContacts,
      activeWorkOrders,
      pendingTimesheets,
      openRequests,
      newContacts,
    ] = await Promise.all([
      companyService.getOverdueFollowUps({ limitCount: 100 }),
      dealService.getOverdueFollowUps({ limitCount: 100 }),
      contactService.getOverdueFollowUps({ limitCount: 100 }),
      companyService.getTodayFollowUps({ limitCount: 100 }),
      dealService.getTodayFollowUps({ limitCount: 100 }),
      contactService.getTodayFollowUps({ limitCount: 100 }),
      workOrderService.getActive({ limitCount: 100 }),
      timeEntryService.getPendingApproval({ limitCount: 100 }),
      requestService.getOpen({ limitCount: 100 }),
      contactService.getRecentNew({ limitCount: 100 }),
    ]);

    return {
      overdueNextActions:
        overdueCompanies.length + overdueDeals.length + overdueContacts.length,
      todayNextActions:
        todayCompanies.length + todayDeals.length + todayContacts.length,
      openWorkOrders: activeWorkOrders.length,
      pendingTimesheets: pendingTimesheets.length,
      openRequests: openRequests.length,
      newContacts: newContacts.length,
    };
  },

  /**
   * Bugunku ve geciken takipleri getirir
   */
  getFollowUps: async (options?: {
    limitCount?: number;
  }): Promise<FollowUpItem[]> => {
    const limitPerType = options?.limitCount
      ? Math.ceil(options.limitCount / 3)
      : 10;

    const [
      overdueCompanies,
      overdueDeals,
      overdueContacts,
      todayCompanies,
      todayDeals,
      todayContacts,
    ] = await Promise.all([
      companyService.getOverdueFollowUps({ limitCount: limitPerType }),
      dealService.getOverdueFollowUps({ limitCount: limitPerType }),
      contactService.getOverdueFollowUps({ limitCount: limitPerType }),
      companyService.getTodayFollowUps({ limitCount: limitPerType }),
      dealService.getTodayFollowUps({ limitCount: limitPerType }),
      contactService.getTodayFollowUps({ limitCount: limitPerType }),
    ]);

    const mapCompanyToFollowUp = (
      company: Company,
      isOverdue: boolean
    ): FollowUpItem => ({
      type: 'company',
      id: company.id,
      title: company.name,
      nextAction: company.nextAction,
      nextActionDate: company.nextActionDate,
      ownerId: company.ownerId,
      ownerName: null,
      lastActivityAt: company.lastActivityAt,
      isOverdue,
    });

    const mapDealToFollowUp = (
      deal: Deal,
      isOverdue: boolean
    ): FollowUpItem => ({
      type: 'deal',
      id: deal.id,
      title: deal.title,
      nextAction: deal.nextAction,
      nextActionDate: deal.nextActionDate,
      ownerId: deal.ownerId,
      ownerName: null,
      lastActivityAt: deal.lastActivityAt,
      isOverdue,
    });

    const mapContactToFollowUp = (
      contact: Contact,
      isOverdue: boolean
    ): FollowUpItem => ({
      type: 'contact',
      id: contact.id,
      title: contact.fullName,
      nextAction: contact.nextAction,
      nextActionDate: contact.nextActionDate,
      ownerId: contact.ownerId,
      ownerName: null,
      lastActivityAt: contact.lastActivityAt,
      isOverdue,
    });

    const followUps: FollowUpItem[] = [
      ...overdueCompanies.map((c) => mapCompanyToFollowUp(c, true)),
      ...overdueDeals.map((d) => mapDealToFollowUp(d, true)),
      ...overdueContacts.map((c) => mapContactToFollowUp(c, true)),
      ...todayCompanies.map((c) => mapCompanyToFollowUp(c, false)),
      ...todayDeals.map((d) => mapDealToFollowUp(d, false)),
      ...todayContacts.map((c) => mapContactToFollowUp(c, false)),
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

    return options?.limitCount
      ? followUps.slice(0, options.limitCount)
      : followUps;
  },

  /**
   * Networking kisilerini getirir (stage: new | networking, son 7 gun)
   */
  getNetworkingContacts: async (options?: {
    limitCount?: number;
  }): Promise<NetworkingItem[]> => {
    const contacts = await contactService.getRecentNew({
      limitCount: options?.limitCount ?? 20,
    });

    return contacts.map(
      (contact): NetworkingItem => ({
        id: contact.id,
        fullName: contact.fullName,
        companyName: contact.companyName,
        stage: contact.stage,
        source: contact.source,
        sourceDetail: contact.sourceDetail,
        nextAction: contact.nextAction,
        nextActionDate: contact.nextActionDate,
        lastActivityAt: contact.lastActivityAt,
        createdAt: contact.createdAt,
      })
    );
  },

  /**
   * Acik talepleri getirir (status: open | in-progress)
   */
  getOpenRequests: async (options?: {
    limitCount?: number;
  }): Promise<RequestSummaryItem[]> => {
    const requests = await requestService.getOpen({
      limitCount: options?.limitCount ?? 20,
    });

    return requests.map(
      (request): RequestSummaryItem => ({
        id: request.id,
        title: request.title,
        type: request.type,
        priority: request.priority,
        status: request.status,
        requesterName: request.requesterName,
        assigneeName: request.assigneeName,
        companyName: request.companyName,
        dueDate: request.dueDate,
        createdAt: request.createdAt,
      })
    );
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
    const [companies, deals, contacts] = await Promise.all([
      companyService.getOverdueFollowUps({ limitCount: 1 }),
      dealService.getOverdueFollowUps({ limitCount: 1 }),
      contactService.getOverdueFollowUps({ limitCount: 1 }),
    ]);

    const oldestDates: number[] = [];
    if (companies[0]?.nextActionDate) {
      oldestDates.push(companies[0].nextActionDate.toMillis());
    }
    if (deals[0]?.nextActionDate) {
      oldestDates.push(deals[0].nextActionDate.toMillis());
    }
    if (contacts[0]?.nextActionDate) {
      oldestDates.push(contacts[0].nextActionDate.toMillis());
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
    const workOrders = await workOrderService.getRiskyWorkOrders({
      limitCount: 50,
    });
    return workOrders.filter((wo) => wo.isDueSoon && !wo.isOverdue).length;
  },
};
