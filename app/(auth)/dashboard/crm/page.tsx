'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCrmDashboard } from '@/hooks/use-crm-dashboard';
import {
  CrmDashboardListSheet,
  FollowUpsPanel,
  KPICards,
  NetworkingPanel,
  RequestsPanel,
} from '@/components/dashboard';
import type { CrmDashboardEntityType, CrmDashboardListContext } from '@/components/dashboard/crm-dashboard-list-sheet';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/app-header';
import { useAuth } from '@/components/auth/auth-provider';
import { contactService } from '@/lib/firebase/contacts';
import { companyService } from '@/lib/firebase/companies';
import { dealService } from '@/lib/firebase/deals';
import { requestService } from '@/lib/firebase/requests';
import { userService } from '@/lib/firebase/users';
import { ContactFormDialog } from '@/components/crm/contact-form-dialog';
import { CompanyFormDialog } from '@/components/crm/company-form-dialog';
import { DealFormDialog } from '@/components/crm/deal-form-dialog';
import { RequestFormDialog } from '@/components/crm/request-form-dialog';
import type {
  Company,
  CompanyFormData,
  Contact,
  ContactFormData,
  Deal,
  DealFormData,
  FollowUpItem,
  Request,
  RequestFormData,
  User,
} from '@/lib/types';

const CRM_KPI_CARDS = [
  'overdueNextActions',
  'todayNextActions',
  'newContacts',
  'openRequests',
] as const;

type CrmKpiCardKey = (typeof CRM_KPI_CARDS)[number];

export default function CrmDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useCrmDashboard();

  const [listSheetOpen, setListSheetOpen] = useState(false);
  const [listContext, setListContext] = useState<CrmDashboardListContext>('followups');
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const [loadingEditor, setLoadingEditor] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const records = await userService.getAllUsers();
        setUsers(records);
      } catch (loadError) {
        console.error('Users could not be loaded for request editor:', loadError);
      }
    };

    void loadUsers();
  }, []);

  const clearEditors = () => {
    setEditingContact(null);
    setEditingCompany(null);
    setEditingDeal(null);
    setEditingRequest(null);
  };

  const openList = (context: CrmDashboardListContext) => {
    clearEditors();
    setListContext(context);
    setListSheetOpen(true);
  };

  const refreshDashboardAndList = async () => {
    await refresh();
    setListRefreshKey((prev) => prev + 1);
  };

  const openEditor = async (entityType: CrmDashboardEntityType, id: string) => {
    clearEditors();
    setListSheetOpen(false);
    setLoadingEditor(true);

    try {
      if (entityType === 'contact') {
        const record = await contactService.getById(id);
        if (!record) {
          toast.error('Kişi bulunamadı');
          return;
        }
        setEditingContact(record);
        return;
      }

      if (entityType === 'company') {
        const record = await companyService.getById(id);
        if (!record) {
          toast.error('Şirket bulunamadı');
          return;
        }
        setEditingCompany(record);
        return;
      }

      if (entityType === 'deal') {
        const record = await dealService.getById(id);
        if (!record) {
          toast.error('Fırsat bulunamadı');
          return;
        }
        setEditingDeal(record);
        return;
      }

      const record = await requestService.getById(id);
      if (!record) {
        toast.error('Talep bulunamadı');
        return;
      }
      setEditingRequest(record);
    } catch (loadError) {
      console.error('Editor data could not be loaded:', loadError);
      toast.error('Kayıt detayları yüklenemedi');
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleFollowUpSelect = (item: FollowUpItem) => {
    void openEditor(item.type, item.id);
  };

  const handleKpiClick = (key: string) => {
    const kpiKey = key as CrmKpiCardKey;

    if (kpiKey === 'overdueNextActions') {
      openList('followupsOverdue');
      return;
    }

    if (kpiKey === 'todayNextActions') {
      openList('followupsToday');
      return;
    }

    if (kpiKey === 'newContacts') {
      openList('newContacts');
      return;
    }

    if (kpiKey === 'openRequests') {
      openList('openRequests');
    }
  };

  const handleContactUpdate = async (values: ContactFormData) => {
    if (!user || !editingContact) return;

    try {
      await contactService.update(editingContact.id, values, user.uid);
      toast.success('Kişi güncellendi');
      await refreshDashboardAndList();
    } catch (updateError) {
      console.error('Contact update failed:', updateError);
      toast.error('Kişi güncellenemedi');
      throw updateError;
    }
  };

  const handleCompanyUpdate = async (values: CompanyFormData) => {
    if (!user || !editingCompany) return;

    try {
      await companyService.update(editingCompany.id, values, user.uid);
      toast.success('Şirket güncellendi');
      await refreshDashboardAndList();
    } catch (updateError) {
      console.error('Company update failed:', updateError);
      toast.error('Şirket güncellenemedi');
      throw updateError;
    }
  };

  const handleDealUpdate = async (values: DealFormData) => {
    if (!user || !editingDeal) return;

    try {
      await dealService.update(editingDeal.id, values, user.uid);
      toast.success('Fırsat güncellendi');
      await refreshDashboardAndList();
    } catch (updateError) {
      console.error('Deal update failed:', updateError);
      toast.error('Fırsat güncellenemedi');
      throw updateError;
    }
  };

  const handleRequestUpdate = async (values: RequestFormData) => {
    if (!user || !editingRequest) return;

    try {
      await requestService.update(editingRequest.id, values, user.uid);
      toast.success('Talep güncellendi');
      await refreshDashboardAndList();
    } catch (updateError) {
      console.error('Request update failed:', updateError);
      toast.error('Talep güncellenemedi');
      throw updateError;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="CRM Dashboard" description="Takipler, pipeline ve networking" />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Veri yüklenirken hata oluştu</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              Tekrar Dene
            </Button>
          </div>
        </div>
      )}

      <KPICards
        kpis={data.kpis}
        loading={loading}
        oldestOverdueDays={data.oldestOverdueDays}
        thisWeekDeliveryCount={0}
        visibleCards={[...CRM_KPI_CARDS]}
        onCardClick={handleKpiClick}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <NetworkingPanel
          contacts={data.networkingContacts}
          loading={loading}
          onOpenList={() => openList('networking')}
          onSelectContact={(id) => void openEditor('contact', id)}
        />
        <FollowUpsPanel
          followUps={data.followUps}
          loading={loading}
          onOpenList={() => openList('followups')}
          onSelectFollowUp={handleFollowUpSelect}
          onRefresh={refreshDashboardAndList}
        />
        <RequestsPanel
          requests={data.openRequests}
          loading={loading}
          onOpenList={() => openList('openRequests')}
          onSelectRequest={(id) => void openEditor('request', id)}
        />
      </div>

      <CrmDashboardListSheet
        open={listSheetOpen}
        onOpenChange={setListSheetOpen}
        context={listContext}
        refreshKey={listRefreshKey}
        onSelectEntity={(entityType, id) => {
          void openEditor(entityType, id);
        }}
      />

      <ContactFormDialog
        open={!!editingContact}
        onOpenChange={(open) => {
          if (!open) setEditingContact(null);
        }}
        contact={editingContact}
        onSubmit={handleContactUpdate}
        presentation="right"
      />

      <CompanyFormDialog
        open={!!editingCompany}
        onOpenChange={(open) => {
          if (!open) setEditingCompany(null);
        }}
        company={editingCompany}
        onSubmit={handleCompanyUpdate}
        presentation="right"
      />

      <DealFormDialog
        open={!!editingDeal}
        onOpenChange={(open) => {
          if (!open) setEditingDeal(null);
        }}
        deal={editingDeal}
        onSubmit={handleDealUpdate}
        presentation="right"
      />

      <RequestFormDialog
        open={!!editingRequest}
        onOpenChange={(open) => {
          if (!open) setEditingRequest(null);
        }}
        request={editingRequest}
        users={users}
        onSubmit={handleRequestUpdate}
        presentation="right"
      />
    </div>
  );
}
