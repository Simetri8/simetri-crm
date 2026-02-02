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

export default function PipelinePage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const loadDeals = async () => {
    try {
      const data = await dealService.getActivePipeline();
      setDeals(data);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error('Firsatlar yuklenemedi');
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
      toast.success('Firsat olusturuldu');
      loadDeals();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Firsat olusturulamadi');
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
        `Asama degisti: ${oldStage} -> ${newStage}`,
        { dealId },
        user.uid
      );

      toast.success('Asama guncellendi');
      loadDeals();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Asama guncellenemedi');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Satis Pipeline</h1>
          <p className="text-muted-foreground">
            Satis firsatlarini takip edin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Firsat
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground">Pipeline bos</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setFormOpen(true)}
            >
              Ilk firsati ekle
            </Button>
          </div>
        ) : (
          <DealPipeline deals={deals} onStageChange={handleStageChange} />
        )}
      </div>

      <DealFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
