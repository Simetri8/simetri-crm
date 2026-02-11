import {
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getCollection } from './firestore';
import type {
  Contact,
  Deal,
  Company,
  WorkOrder,
  Request,
} from '@/lib/types';
import { ENTITY_COLORS, type EntityType } from '@/lib/constants/entity-colors';

// =============================================================================
// CALENDAR EVENT TYPES
// =============================================================================

export type CalendarEventSource = EntityType;

export const CALENDAR_SOURCE_COLORS: Record<CalendarEventSource, string> = {
  contact: ENTITY_COLORS.contact.hex,
  company: ENTITY_COLORS.company.hex,
  deal: ENTITY_COLORS.deal.hex,
  'work-order': ENTITY_COLORS['work-order'].hex,
  request: ENTITY_COLORS.request.hex,
};

export const CALENDAR_SOURCE_LABELS: Record<CalendarEventSource, string> = {
  contact: ENTITY_COLORS.contact.label,
  company: ENTITY_COLORS.company.label,
  deal: ENTITY_COLORS.deal.label,
  'work-order': ENTITY_COLORS['work-order'].label,
  request: ENTITY_COLORS.request.label,
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  source: CalendarEventSource;
  sourceId: string;
  color: string;
  subtitle?: string;
  url: string; // detay sayfasına yönlendirme linki
};

// =============================================================================
// CALENDAR SERVICE
// =============================================================================

export const calendarService = {
  /**
   * Belirli bir ay için tüm takvim olaylarını getirir.
   * 5 kaynaktan paralel sorgu yapar ve birleştirir.
   */
  async getEventsForMonth(
    year: number,
    month: number, // 0-indexed
    filters?: CalendarEventSource[]
  ): Promise<CalendarEvent[]> {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const startTs = Timestamp.fromDate(startOfMonth);
    const endTs = Timestamp.fromDate(endOfMonth);

    const activeSources = filters || (['contact', 'deal', 'company', 'work-order', 'request'] as CalendarEventSource[]);

    const promises: Promise<CalendarEvent[]>[] = [];

    if (activeSources.includes('contact')) {
      promises.push(this._getContactEvents(startTs, endTs));
    }
    if (activeSources.includes('deal')) {
      promises.push(this._getDealEvents(startTs, endTs));
    }
    if (activeSources.includes('company')) {
      promises.push(this._getCompanyEvents(startTs, endTs));
    }
    if (activeSources.includes('work-order')) {
      promises.push(this._getWorkOrderEvents(startTs, endTs));
    }
    if (activeSources.includes('request')) {
      promises.push(this._getRequestEvents(startTs, endTs));
    }

    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  async _getContactEvents(startTs: Timestamp, endTs: Timestamp): Promise<CalendarEvent[]> {
    try {
      const q = query(
        getCollection('contacts'),
        where('nextActionDate', '>=', startTs),
        where('nextActionDate', '<=', endTs),
        orderBy('nextActionDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data() as Contact;
        return {
          id: `contact-${doc.id}`,
          title: data.fullName,
          date: data.nextActionDate!.toDate(),
          source: 'contact' as CalendarEventSource,
          sourceId: doc.id,
          color: CALENDAR_SOURCE_COLORS.contact,
          subtitle: data.nextAction || undefined,
          url: `/crm/contacts`,
        };
      });
    } catch {
      console.error('Takvim: Contact olayları alınamadı');
      return [];
    }
  },

  async _getDealEvents(startTs: Timestamp, endTs: Timestamp): Promise<CalendarEvent[]> {
    try {
      const q = query(
        getCollection('deals'),
        where('nextActionDate', '>=', startTs),
        where('nextActionDate', '<=', endTs),
        orderBy('nextActionDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data() as Deal;
        return {
          id: `deal-${doc.id}`,
          title: data.title,
          date: data.nextActionDate!.toDate(),
          source: 'deal' as CalendarEventSource,
          sourceId: doc.id,
          color: CALENDAR_SOURCE_COLORS.deal,
          subtitle: data.nextAction || data.companyName || undefined,
          url: `/crm/deals/${doc.id}`,
        };
      });
    } catch {
      console.error('Takvim: Deal olayları alınamadı');
      return [];
    }
  },

  async _getCompanyEvents(startTs: Timestamp, endTs: Timestamp): Promise<CalendarEvent[]> {
    try {
      const q = query(
        getCollection('companies'),
        where('nextActionDate', '>=', startTs),
        where('nextActionDate', '<=', endTs),
        orderBy('nextActionDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data() as Company;
        return {
          id: `company-${doc.id}`,
          title: data.name,
          date: data.nextActionDate!.toDate(),
          source: 'company' as CalendarEventSource,
          sourceId: doc.id,
          color: CALENDAR_SOURCE_COLORS.company,
          subtitle: data.nextAction || undefined,
          url: `/crm/companies/${doc.id}`,
        };
      });
    } catch {
      console.error('Takvim: Company olayları alınamadı');
      return [];
    }
  },

  async _getWorkOrderEvents(startTs: Timestamp, endTs: Timestamp): Promise<CalendarEvent[]> {
    try {
      const q = query(
        getCollection('work_orders'),
        where('targetDeliveryDate', '>=', startTs),
        where('targetDeliveryDate', '<=', endTs),
        orderBy('targetDeliveryDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data() as WorkOrder;
        return {
          id: `wo-${doc.id}`,
          title: data.title,
          date: data.targetDeliveryDate.toDate(),
          source: 'work-order' as CalendarEventSource,
          sourceId: doc.id,
          color: CALENDAR_SOURCE_COLORS['work-order'],
          subtitle: data.companyName || undefined,
          url: `/ops/work-orders/${doc.id}`,
        };
      });
    } catch {
      console.error('Takvim: Work Order olayları alınamadı');
      return [];
    }
  },

  async _getRequestEvents(startTs: Timestamp, endTs: Timestamp): Promise<CalendarEvent[]> {
    try {
      const q = query(
        getCollection('requests'),
        where('dueDate', '>=', startTs),
        where('dueDate', '<=', endTs),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data() as Request;
        return {
          id: `req-${doc.id}`,
          title: data.title,
          date: data.dueDate!.toDate(),
          source: 'request' as CalendarEventSource,
          sourceId: doc.id,
          color: CALENDAR_SOURCE_COLORS.request,
          subtitle: data.companyName || data.requesterName || undefined,
          url: `/crm/requests`,
        };
      });
    } catch {
      console.error('Takvim: Request olayları alınamadı');
      return [];
    }
  },
};
