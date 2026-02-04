'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DealPipeline } from '@/components/crm/deal-pipeline';
import { DealFormDialog } from '@/components/crm/deal-form-dialog';
import { dealService } from '@/lib/firebase/deals';
import { activityService } from '@/lib/firebase/activities';
import { useAuth } from '@/components/auth/auth-provider';
import type { Deal, DealFormData, DealStage } from '@/lib/types';
import { PageHeader } from '@/components/layout/app-header';

export default function PipelinePage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const loadDeals = async () => {
    try {
      const data = await dealService.getActivePipeline();
      setDeals(data);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error('Fırsatlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleCreate = async (data: DealFormData) => {
    if (!user) return;
    try {
      await dealService.add(data, user.uid);
      toast.success('Fırsat oluşturuldu');
      loadDeals();
      setFormOpen(false);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Fırsat oluşturulamadı');
    }
  };

  const handleUpdate = async (data: DealFormData) => {
    if (!user || !editingDeal) return;
    try {
      await dealService.update(editingDeal.id, data, user.uid);
      toast.success('Fırsat güncellendi');
      loadDeals();
      setFormOpen(false);
      setEditingDeal(null);
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Fırsat güncellenemedi');
    }
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    if (!user) return;
    try {
      const deal = deals.find((d) => d.id === dealId);
      const oldStage = deal?.stage;

      await dealService.updateStage(dealId, newStage, user.uid);

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'deal_stage_changed',
        `Aşama değişti: ${oldStage} -> ${newStage}`,
        { dealId },
        user.uid
      );

      toast.success('Aşama güncellendi');
      loadDeals();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Aşama güncellenemedi');
    }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <PageHeader
        title="Satış Pipeline"
        description="Satış fırsatlarını takip edin"
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Aktif fırsatlarınızı kolon bazında sürükleyip bırakabilirsiniz.
        </div>
        <Button
          onClick={() => {
            setEditingDeal(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Fırsat
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground">Pipeline boş</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setEditingDeal(null);
                setFormOpen(true);
              }}
            >
              İlk fırsatı ekle
            </Button>
          </div>
        ) : (
          <DealPipeline
            deals={deals}
            onStageChange={handleStageChange}
            onEdit={(deal) => {
              console.log('Editing deal:', deal);
              setEditingDeal(deal);
              setFormOpen(true);
            }}
          />
        )}
      </div>

      <DealFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDeal(null);
        }}
        onSubmit={editingDeal ? handleUpdate : handleCreate}
        deal={editingDeal}
      />
    </div>
  );
}
