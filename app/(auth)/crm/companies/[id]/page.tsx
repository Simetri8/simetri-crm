'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  Plus,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ContactList } from '@/components/crm/contact-list';
import { ContactFormDialog } from '@/components/crm/contact-form-dialog';
import { CompanyFormDialog } from '@/components/crm/company-form-dialog';
import { ActivityFeed } from '@/components/crm/activity-feed';
import { ActivityFormDialog } from '@/components/crm/activity-form-dialog';
import { StatusBadge } from '@/components/crm/status-badge';
import { companyService } from '@/lib/firebase/companies';
import { contactService } from '@/lib/firebase/contacts';
import { activityService } from '@/lib/firebase/activities';
import { dealService } from '@/lib/firebase/deals';
import { useAuth } from '@/components/auth/auth-provider';
import { COMPANY_STATUS_CONFIG } from '@/lib/utils/status';
import type {
  Company,
  CompanyFormData,
  Contact,
  ContactFormData,
  Activity,
  ActivityFormData,
  Deal,
} from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/layout/app-header';

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  const loadData = async () => {
    console.log('CompanyDetailPage loadData for ID:', id);
    try {
      // DEBUG: Fetch company specifically first to log result
      const companyData = await companyService.getById(id);
      console.log('Company Data Result:', companyData);

      const [contactsData, activitiesData, dealsData] = await Promise.all([
        contactService.getByCompanyId(id),
        activityService.getByCompanyId(id, 20),
        dealService.getAll({ companyId: id }),
      ]);
      setCompany(companyData);
      setContacts(contactsData);
      setActivities(activitiesData);
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading company:', error);
      toast.error('Şirket yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateCompany = async (data: CompanyFormData) => {
    if (!user) return;
    try {
      await companyService.update(id, data, user.uid);
      toast.success('Şirket güncellendi');
      loadData();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Şirket güncellenemedi');
    }
  };

  const handleCreateContact = async (data: ContactFormData) => {
    if (!user) return;
    try {
      await contactService.add({ ...data, companyId: id }, user.uid);
      toast.success('Kişi oluşturuldu');
      loadData();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Kişi oluşturulamadı');
    }
  };

  const handleUpdateContact = async (data: ContactFormData) => {
    if (!user || !editingContact) return;
    try {
      await contactService.update(editingContact.id, data, user.uid);
      toast.success('Kişi güncellendi');
      setEditingContact(null);
      loadData();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Kişi güncellenemedi');
    }
  };

  const handleDeleteContact = async () => {
    if (!user || !deleteContact) return;
    try {
      await contactService.delete(deleteContact.id);
      toast.success('Kişi silindi');
      setDeleteContact(null);
      loadData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Kişi silinemedi');
    }
  };

  const handleCreateActivity = async (data: ActivityFormData) => {
    if (!user) return;
    try {
      await activityService.add({ ...data, companyId: id }, user.uid);
      toast.success('Aktivite eklendi');
      loadData();
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Aktivite eklenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Şirket bulunamadı</p>
        <Button variant="outline" onClick={() => router.push('/crm/companies')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Şirketlere Dön
        </Button>
      </div>
    );
  }

  const primaryContact = contacts.find((c) => c.isPrimary);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={company.name}
        description="Şirket detayları, kişiler ve fırsatlar"
      />

      <div className="flex flex-col gap-3 rounded-md border bg-background px-3 py-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/crm/companies')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <StatusBadge config={COMPANY_STATUS_CONFIG[company.status]} />
              {company.tags && company.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {company.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Primary Contact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Birincil Kontak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {primaryContact ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{primaryContact.fullName}</span>
                </div>
                {primaryContact.email && (
                  <a
                    href={`mailto:${primaryContact.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Mail className="h-3 w-3" />
                    {primaryContact.email}
                  </a>
                )}
                {primaryContact.phone && (
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-3 w-3" />
                    {primaryContact.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Atanmamis</p>
            )}
          </CardContent>
        </Card>

        {/* Next Action */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sonraki Adım
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company.nextAction ? (
              <div className="space-y-1">
                <p className="font-medium">{company.nextAction}</p>
                {company.nextActionDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(company.nextActionDate.toDate(), 'dd MMM yyyy', { locale: tr })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Planlanmamış</p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              İstatistikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kişiler</span>
                <span className="font-medium">{contacts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aktif Fırsatlar</span>
                <span className="font-medium">
                  {deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kazanılan</span>
                <span className="font-medium text-green-600">
                  {deals.filter((d) => d.stage === 'won').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activities" className="flex-1">
        <TabsList>
          <TabsTrigger value="activities">Aktiviteler</TabsTrigger>
          <TabsTrigger value="contacts">Kişiler ({contacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Fırsatlar ({deals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Son Aktiviteler</h2>
            <Button onClick={() => setActivityFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Aktivite Ekle
            </Button>
          </div>
          <ActivityFeed activities={activities} showContext={false} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Kişiler</h2>
            <Button onClick={() => setContactFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Kişi Ekle
            </Button>
          </div>
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-muted-foreground">Henüz kişi yok</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setContactFormOpen(true)}
              >
                İlk kişiyi ekle
              </Button>
            </div>
          ) : (
            <ContactList
              contacts={contacts}
              showCompany={false}
              onEdit={(contact) => setEditingContact(contact)}
              onDelete={(contact) => setDeleteContact(contact)}
            />
          )}
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Fırsatlar</h2>
            <Button asChild>
              <Link href="/crm/pipeline">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Fırsat
              </Link>
            </Button>
          </div>
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-muted-foreground">Henüz fırsat yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/crm/deals/${deal.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{deal.title}</span>
                    <Badge variant="outline">{deal.stage}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CompanyFormDialog
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        company={company}
        onSubmit={handleUpdateCompany}
      />

      <ContactFormDialog
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        defaultCompanyId={id}
        onSubmit={handleCreateContact}
      />

      <ContactFormDialog
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
        contact={editingContact}
        defaultCompanyId={id}
        onSubmit={handleUpdateContact}
      />

      <ActivityFormDialog
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        defaultCompanyId={id}
        onSubmit={handleCreateActivity}
      />

      <AlertDialog open={!!deleteContact} onOpenChange={(open) => !open && setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kişiyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteContact?.fullName} kişisini silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
