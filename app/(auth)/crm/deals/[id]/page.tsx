'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  User,
  Calendar,
  CalendarIcon,
  Edit,
  Plus,
  BadgeDollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DealFormDialog } from '@/components/crm/deal-form-dialog';
import { ActivityFeed } from '@/components/crm/activity-feed';
import { ActivityFormDialog } from '@/components/crm/activity-form-dialog';
import { StatusBadge } from '@/components/crm/status-badge';
import { dealService } from '@/lib/firebase/deals';
import { activityService } from '@/lib/firebase/activities';
import { proposalService } from '@/lib/firebase/proposals';
import { workOrderService } from '@/lib/firebase/work-orders';
import { useAuth } from '@/components/auth/auth-provider';
import {
  DEAL_STAGE_CONFIG,
  DEAL_STAGE_ORDER,
  formatMoney,
  LOST_REASON_LABELS,
  PROPOSAL_STATUS_CONFIG,
} from '@/lib/utils/status';
import type { Deal, DealFormData, Activity, ActivityFormData, DealStage, Proposal } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/app-header';

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [showCreateWorkOrderDialog, setShowCreateWorkOrderDialog] = useState(false);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState<Date | undefined>(undefined);
  const [createWorkOrderLoading, setCreateWorkOrderLoading] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<DealStage | null>(null);
  const [showLostReasonDialog, setShowLostReasonDialog] = useState(false);
  const [selectedLostReason, setSelectedLostReason] = useState<string>('');

  const loadData = async () => {
    try {
      const [dealData, activitiesData, proposalsData] = await Promise.all([
        dealService.getById(id),
        activityService.getByDealId(id, 20),
        proposalService.getByDealId(id),
      ]);
      setDeal(dealData);
      setActivities(activitiesData);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error loading deal:', error);
      toast.error('Fırsat yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateDeal = async (data: DealFormData) => {
    if (!user) return;
    try {
      await dealService.update(id, data, user.uid);
      toast.success('Fırsat güncellendi');
      loadData();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Fırsat güncellenemedi');
    }
  };

  const handleStageChange = async (newStage: DealStage) => {
    if (!user || !deal) return;

    // Eger "won" secildiyse, once İş Emri olusturma dialogunu goster
    if (newStage === 'won' && deal.stage !== 'won') {
      setPendingStageChange(newStage);
      setTargetDeliveryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 gün sonra default
      setShowCreateWorkOrderDialog(true);
      return;
    }

    // Eger "lost" secildiyse, once sebep secimi yap
    if (newStage === 'lost' && deal.stage !== 'lost') {
      setPendingStageChange(newStage);
      setSelectedLostReason('');
      setShowLostReasonDialog(true);
      return;
    }

    await executeStageChange(newStage);
  };

  const executeStageChange = async (newStage: DealStage) => {
    if (!user || !deal) return;
    try {
      const oldStage = deal.stage;
      await dealService.updateStage(id, newStage, user.uid);

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'deal_stage_changed',
        `Aşama değişti: ${DEAL_STAGE_CONFIG[oldStage].label} -> ${DEAL_STAGE_CONFIG[newStage].label}`,
        { dealId: id },
        user.uid
      );

      toast.success('Aşama güncellendi');
      loadData();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Aşama güncellenemedi');
    }
  };

  const handleCreateWorkOrder = async () => {
    if (!user || !pendingStageChange || !targetDeliveryDate) return;

    setCreateWorkOrderLoading(true);
    try {
      // Asamayi degistir
      await executeStageChange(pendingStageChange);

      // İş Emri olustur
      const workOrderId = await workOrderService.createFromDeal(id, targetDeliveryDate, user.uid);

      toast.success('İş emri oluşturuldu');
      setShowCreateWorkOrderDialog(false);
      setPendingStageChange(null);

      // İş Emri sayfasina yonlendir
      router.push(`/ops/work-orders/${workOrderId}`);
    } catch (error) {
      console.error('Error creating work order:', error);
      toast.error('İş emri oluşturulamadı');
    } finally {
      setCreateWorkOrderLoading(false);
    }
  };

  const handleSkipWorkOrder = async () => {
    if (!pendingStageChange) return;

    await executeStageChange(pendingStageChange);
    setShowCreateWorkOrderDialog(false);
    setPendingStageChange(null);
  };

  const handleConfirmLostReason = async () => {
    if (!user || !deal || !pendingStageChange || !selectedLostReason) {
      toast.error('Lütfen bir sebep seçin');
      return;
    }

    try {
      const oldStage = deal.stage;
      await dealService.updateStage(
        id,
        pendingStageChange,
        user.uid,
        selectedLostReason as any
      );

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'deal_stage_changed',
        `Aşama değişti: ${DEAL_STAGE_CONFIG[oldStage].label} -> ${DEAL_STAGE_CONFIG[pendingStageChange].label} (${LOST_REASON_LABELS[selectedLostReason as keyof typeof LOST_REASON_LABELS]})`,
        { dealId: id },
        user.uid
      );

      toast.success('Fırsat kaybedildi olarak işaretlendi');
      setShowLostReasonDialog(false);
      setPendingStageChange(null);
      setSelectedLostReason('');
      loadData();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Fırsat güncellenemedi');
    }
  };

  const handleCreateActivity = async (data: ActivityFormData) => {
    if (!user) return;
    try {
      await activityService.add({ ...data, dealId: id }, user.uid);
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

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Fırsat bulunamadı</p>
        <Button variant="outline" onClick={() => router.push('/crm/pipeline')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Pipeline&apos;a Dön
        </Button>
      </div>
    );
  }

  const isActive = deal.stage !== 'won' && deal.stage !== 'lost';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={deal.title}
        description={deal.companyName}
      />

      <div className="flex flex-col gap-3 bg-background text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/crm/pipeline')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Link
                href={`/crm/companies/${deal.companyId}`}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Building2 className="h-4 w-4" />
                {deal.companyName}
              </Link>
              <span>•</span>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {deal.primaryContactName}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={deal.stage}
              onValueChange={(value) => handleStageChange(value as DealStage)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <StatusBadge config={DEAL_STAGE_CONFIG[deal.stage]} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGE_ORDER.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${DEAL_STAGE_CONFIG[stage].bgColor}`}
                      />
                      {DEAL_STAGE_CONFIG[stage].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setEditFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>

      {/* Won/Lost Banner */}
      {!isActive && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${deal.stage === 'won'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
            }`}
        >
          {deal.stage === 'won' ? (
            <>
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">
                Bu fırsat kazanıldı
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-700">
                Bu fırsat kaybedildi
                {deal.lostReason && ` - ${LOST_REASON_LABELS[deal.lostReason]}`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Budget */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tahmini Bütçe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.estimatedBudgetMinor ? (
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-green-600" />
                <span className="text-xl font-semibold">
                  {formatMoney(deal.estimatedBudgetMinor, deal.currency)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belirlenmedi</p>
            )}
          </CardContent>
        </Card>

        {/* Expected Close Date */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Beklenen Kapanma
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.expectedCloseDate ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-medium">
                  {format(deal.expectedCloseDate.toDate(), 'dd MMMM yyyy', { locale: tr })}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belirlenmedi</p>
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
            {deal.nextAction ? (
              <div className="space-y-1">
                <p className="font-medium">{deal.nextAction}</p>
                {deal.nextActionDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(deal.nextActionDate.toDate(), 'dd MMM yyyy', { locale: tr })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Planlanmamış</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activities" className="flex-1">
        <TabsList>
          <TabsTrigger value="activities">Aktiviteler</TabsTrigger>
          <TabsTrigger value="proposals">Teklifler</TabsTrigger>
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

        <TabsContent value="proposals" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Teklifler ({proposals.length})</h2>
            <Button asChild>
              <Link href={`/crm/proposals/new?dealId=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Teklif
              </Link>
            </Button>
          </div>
          {proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center border rounded-lg">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Henüz teklif yok</p>
              <Button variant="link" asChild className="mt-2">
                <Link href={`/crm/proposals/new?dealId=${id}`}>
                  İlk teklifi oluştur
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/crm/proposals/${proposal.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Versiyon {proposal.version}</span>
                          <StatusBadge config={PROPOSAL_STATUS_CONFIG[proposal.status]} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(proposal.createdAt.toDate(), 'dd MMM yyyy', { locale: tr })}
                          {proposal.sentAt && ` • Gönderildi: ${format(proposal.sentAt.toDate(), 'dd MMM yyyy', { locale: tr })}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMoney(proposal.grandTotalMinor, proposal.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {proposal.items.length} kalem
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DealFormDialog
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        deal={deal}
        onSubmit={handleUpdateDeal}
      />

      <ActivityFormDialog
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        defaultDealId={id}
        defaultCompanyId={deal.companyId}
        onSubmit={handleCreateActivity}
      />

      {/* Create Work Order Dialog */}
      <Dialog open={showCreateWorkOrderDialog} onOpenChange={setShowCreateWorkOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              İş Emri Oluştur
            </DialogTitle>
            <DialogDescription>
              Fırsat kazanıldı! Bu fırsat için otomatik bir iş emri oluşturmak ister misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hedef Teslim Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !targetDeliveryDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDeliveryDate
                      ? format(targetDeliveryDate, 'dd MMMM yyyy', { locale: tr })
                      : 'Tarih seç'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={targetDeliveryDate}
                    onSelect={setTargetDeliveryDate}
                    locale={tr}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Oluşturulacak İş Emri:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Başlık: {deal.title}</li>
                <li>• Şirket: {deal.companyName}</li>
                {proposals.some((p) => p.status === 'accepted') && (
                  <li>• Kabul edilen teklif bağlanacak</li>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkipWorkOrder}
              disabled={createWorkOrderLoading}
            >
              Atla
            </Button>
            <Button
              onClick={handleCreateWorkOrder}
              disabled={!targetDeliveryDate || createWorkOrderLoading}
            >
              {createWorkOrderLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İş Emri Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lost Reason Dialog */}
      <Dialog open={showLostReasonDialog} onOpenChange={setShowLostReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Fırsat Kaybedildi
            </DialogTitle>
            <DialogDescription>
              Bu fırsatı kaybedildi olarak işaretlemek için lütfen bir sebep seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kayıp Sebebi *</Label>
              <Select value={selectedLostReason} onValueChange={setSelectedLostReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sebep seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOST_REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowLostReasonDialog(false);
                setPendingStageChange(null);
                setSelectedLostReason('');
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmLostReason}
              disabled={!selectedLostReason}
            >
              Kaybedildi Olarak İşaretle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
