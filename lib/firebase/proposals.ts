import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getCollection } from './firestore';
import type {
  Proposal,
  ProposalFormData,
  ProposalStatus,
  ProposalItem,
  Deal,
  Company,
} from '@/lib/types';

const COLLECTION = 'proposals';

/**
 * Teklif kalemlerinden toplam hesaplar
 */
function calculateTotals(
  items: ProposalItem[],
  pricesIncludeTax: boolean
): { subtotalMinor: number; taxTotalMinor: number; grandTotalMinor: number } {
  let subtotalMinor = 0;
  let taxTotalMinor = 0;

  items.forEach((item) => {
    const lineTotal = item.unitPriceMinor * item.quantity;

    if (pricesIncludeTax) {
      // Fiyatlar KDV dahil, KDV'yi cikar
      const taxMultiplier = 1 + item.taxRate / 100;
      const lineSubtotal = Math.round(lineTotal / taxMultiplier);
      const lineTax = lineTotal - lineSubtotal;
      subtotalMinor += lineSubtotal;
      taxTotalMinor += lineTax;
    } else {
      // Fiyatlar KDV haric, KDV'yi ekle
      const lineTax = Math.round(lineTotal * (item.taxRate / 100));
      subtotalMinor += lineTotal;
      taxTotalMinor += lineTax;
    }
  });

  return {
    subtotalMinor,
    taxTotalMinor,
    grandTotalMinor: subtotalMinor + taxTotalMinor,
  };
}

export const proposalService = {
  /**
   * Tum teklifleri getirir
   */
  getAll: async (options?: {
    dealId?: string;
    companyId?: string;
    status?: ProposalStatus;
    isArchived?: boolean;
    limitCount?: number;
  }): Promise<Proposal[]> => {
    let q = query(
      getCollection<Proposal>(COLLECTION),
      orderBy('createdAt', 'desc')
    );

    if (options?.dealId) {
      q = query(q, where('dealId', '==', options.dealId));
    }
    if (options?.companyId) {
      q = query(q, where('companyId', '==', options.companyId));
    }
    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.isArchived !== undefined) {
      q = query(q, where('isArchived', '==', options.isArchived));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Deal'in tekliflerini getirir
   */
  getByDealId: async (dealId: string): Promise<Proposal[]> => {
    const q = query(
      getCollection<Proposal>(COLLECTION),
      where('dealId', '==', dealId),
      orderBy('version', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Tek bir teklifi getirir
   */
  getById: async (id: string): Promise<Proposal | null> => {
    const docRef = doc(getCollection<Proposal>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Deal'in son versiyon numarasini getirir
   */
  getLatestVersion: async (dealId: string): Promise<number> => {
    const q = query(
      getCollection<Proposal>(COLLECTION),
      where('dealId', '==', dealId),
      orderBy('version', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return 0;
    return snapshot.docs[0].data().version;
  },

  /**
   * Yeni teklif ekler
   */
  add: async (data: ProposalFormData, userId: string): Promise<string> => {
    // Deal ve Company bilgilerini al
    const dealRef = doc(getCollection<Deal>('deals'), data.dealId);
    const dealSnap = await getDoc(dealRef);
    if (!dealSnap.exists()) {
      throw new Error('Deal not found');
    }
    const deal = dealSnap.data();

    const companyRef = doc(getCollection<Company>('companies'), deal.companyId);
    const companySnap = await getDoc(companyRef);
    const companyName = companySnap.exists() ? companySnap.data().name : '';

    // Versiyon numarasini belirle
    const latestVersion = await proposalService.getLatestVersion(data.dealId);
    const newVersion = data.version ?? latestVersion + 1;

    // Items'i hazirla
    const items: ProposalItem[] = data.items.map((item) => ({
      catalogItemId: item.catalogItemId ?? null,
      title: item.title,
      description: item.description ?? null,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceMinor: item.unitPriceMinor,
      taxRate: item.taxRate,
    }));

    const pricesIncludeTax = data.pricesIncludeTax ?? true;
    const totals = calculateTotals(items, pricesIncludeTax);

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Proposal>(COLLECTION), {
      dealId: data.dealId,
      dealTitle: deal.title,
      companyId: deal.companyId,
      companyName,
      version: newVersion,
      status: 'draft',
      currency: data.currency ?? deal.currency ?? 'TRY',
      pricesIncludeTax,
      items,
      ...totals,
      sentAt: null,
      acceptedAt: null,
      acceptedByName: null,
      acceptanceNote: null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      isArchived: false,
    } as Proposal);
    return docRef.id;
  },

  /**
   * Teklif gunceller
   */
  update: async (
    id: string,
    data: {
      items?: ProposalFormData['items'];
      pricesIncludeTax?: boolean;
      currency?: Proposal['currency'];
    },
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Proposal>(COLLECTION), id);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      throw new Error('Proposal not found');
    }
    const proposal = existing.data();

    // Sadece draft teklifler guncellenebilir
    if (proposal.status !== 'draft') {
      throw new Error('Only draft proposals can be updated');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (data.currency !== undefined) {
      updateData.currency = data.currency;
    }
    if (data.pricesIncludeTax !== undefined) {
      updateData.pricesIncludeTax = data.pricesIncludeTax;
    }

    if (data.items !== undefined) {
      const items: ProposalItem[] = data.items.map((item) => ({
        catalogItemId: item.catalogItemId ?? null,
        title: item.title,
        description: item.description ?? null,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceMinor: item.unitPriceMinor,
        taxRate: item.taxRate,
      }));

      const pricesIncludeTax =
        data.pricesIncludeTax ?? proposal.pricesIncludeTax;
      const totals = calculateTotals(items, pricesIncludeTax);

      updateData.items = items;
      updateData.subtotalMinor = totals.subtotalMinor;
      updateData.taxTotalMinor = totals.taxTotalMinor;
      updateData.grandTotalMinor = totals.grandTotalMinor;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Teklifi "Gonderildi" olarak isaretler
   */
  markAsSent: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<Proposal>(COLLECTION), id);
    await updateDoc(docRef, {
      status: 'sent',
      sentAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Teklifi kabul edildi olarak isaretler
   */
  markAsAccepted: async (
    id: string,
    acceptedByName: string,
    acceptanceNote: string | null,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Proposal>(COLLECTION), id);
    await updateDoc(docRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedByName,
      acceptanceNote,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Teklifi reddedildi olarak isaretler
   */
  markAsRejected: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<Proposal>(COLLECTION), id);
    await updateDoc(docRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Teklifi arsivler
   */
  archive: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<Proposal>(COLLECTION), id);
    await updateDoc(docRef, {
      isArchived: true,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Teklifi siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Proposal>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Mevcut tekliften yeni versiyon olusturur
   */
  createNewVersion: async (
    existingProposalId: string,
    userId: string
  ): Promise<string> => {
    const existing = await proposalService.getById(existingProposalId);
    if (!existing) {
      throw new Error('Proposal not found');
    }

    const latestVersion = await proposalService.getLatestVersion(existing.dealId);

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Proposal>(COLLECTION), {
      dealId: existing.dealId,
      dealTitle: existing.dealTitle,
      companyId: existing.companyId,
      companyName: existing.companyName,
      version: latestVersion + 1,
      status: 'draft',
      currency: existing.currency,
      pricesIncludeTax: existing.pricesIncludeTax,
      items: existing.items,
      subtotalMinor: existing.subtotalMinor,
      taxTotalMinor: existing.taxTotalMinor,
      grandTotalMinor: existing.grandTotalMinor,
      sentAt: null,
      acceptedAt: null,
      acceptedByName: null,
      acceptanceNote: null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      isArchived: false,
    } as Proposal);
    return docRef.id;
  },
};
