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
  Edit,
  Plus,
  BadgeDollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DealFormDialog } from '@/components/crm/deal-form-dialog';
import { ActivityFeed } from '@/components/crm/activity-feed';
import { ActivityFormDialog } from '@/components/crm/activity-form-dialog';
import { StatusBadge } from '@/components/crm/status-badge';
import { dealService } from '@/lib/firebase/deals';
import { activityService } from '@/lib/firebase/activities';
import { useAuth } from '@/components/auth/auth-provider';
import { DEAL_STAGE_CONFIG, DEAL_STAGE_ORDER, formatMoney, LOST_REASON_LABELS } from '@/lib/utils/status';
import type { Deal, DealFormData, Activity, ActivityFormData, DealStage } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  const loadData = async () => {
    try {
      const [dealData, activitiesData] = await Promise.all([
        dealService.getById(id),
        activityService.getByDealId(id, 20),
      ]);
      setDeal(dealData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading deal:', error);
      toast.error('Firsat yuklenemedi');
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
      toast.success('Firsat guncellendi');
      loadData();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Firsat guncellenemedi');
    }
  };

  const handleStageChange = async (newStage: DealStage) => {
    if (!user || !deal) return;
    try {
      const oldStage = deal.stage;
      await dealService.updateStage(id, newStage, user.uid);

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'deal_stage_changed',
        `Asama degisti: ${DEAL_STAGE_CONFIG[oldStage].label} -> ${DEAL_STAGE_CONFIG[newStage].label}`,
        { dealId: id },
        user.uid
      );

      toast.success('Asama guncellendi');
      loadData();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Asama guncellenemedi');
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
        <p className="text-muted-foreground">Firsat bulunamadi</p>
        <Button variant="outline" onClick={() => router.push('/crm/pipeline')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Pipeline'a Don
        </Button>
      </div>
    );
  }

  const isActive = deal.stage !== 'won' && deal.stage !== 'lost';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/crm/pipeline')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-semibold">{deal.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <Link
                href={`/crm/companies/${deal.companyId}`}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Building2 className="h-4 w-4" />
                {deal.companyName}
              </Link>
              <span>|</span>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {deal.primaryContactName}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Stage Selector */}
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
          <Button variant="outline" onClick={() => setEditFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Duzenle
          </Button>
        </div>
      </div>

      {/* Won/Lost Banner */}
      {!isActive && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            deal.stage === 'won'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {deal.stage === 'won' ? (
            <>
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">
                Bu firsat kazanildi
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-700">
                Bu firsat kaybedildi
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
              Tahmini Butce
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
              Sonraki Adim
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
              <p className="text-sm text-muted-foreground">Planlanmamis</p>
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
            <h2 className="text-lg font-medium">Teklifler</h2>
            <Button asChild>
              <Link href={`/crm/proposals/new?dealId=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Teklif
              </Link>
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-muted-foreground">
              Teklif modulu henuz hazir degil
            </p>
          </div>
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
    </div>
  );
}
