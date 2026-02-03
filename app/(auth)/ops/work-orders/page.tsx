'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkOrderList } from '@/components/ops/work-order-list';
import { WorkOrderFormDialog } from '@/components/ops/work-order-form-dialog';
import { workOrderService } from '@/lib/firebase/work-orders';
import { companyService } from '@/lib/firebase/companies';
import { dealService } from '@/lib/firebase/deals';
import { useAuth } from '@/components/auth/auth-provider';
import { WORK_ORDER_STATUSES } from '@/lib/types';
import { WORK_ORDER_STATUS_CONFIG } from '@/lib/utils/status';
import type { WorkOrder, WorkOrderFormData, WorkOrderStatus, Company, Deal } from '@/lib/types';
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

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [deleteWorkOrder, setDeleteWorkOrder] = useState<WorkOrder | null>(null);
  const [archiveWorkOrder, setArchiveWorkOrder] = useState<WorkOrder | null>(null);

  const loadData = async () => {
    try {
      const [workOrdersData, companiesData, dealsData] = await Promise.all([
        workOrderService.getAll({ isArchived: false }),
        companyService.getAll({ status: 'active' }),
        dealService.getAll({ isArchived: false }),
      ]);
      setWorkOrders(workOrdersData);
      setCompanies(companiesData);
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (data: WorkOrderFormData) => {
    if (!user) return;
    try {
      await workOrderService.add(data, user.uid);
      toast.success('Is emri olusturuldu');
      loadData();
    } catch (error) {
      console.error('Error creating work order:', error);
      toast.error('Is emri olusturulamadi');
    }
  };

  const handleUpdate = async (data: WorkOrderFormData) => {
    if (!user || !editingWorkOrder) return;
    try {
      await workOrderService.update(editingWorkOrder.id, data, user.uid);
      toast.success('Is emri guncellendi');
      setEditingWorkOrder(null);
      loadData();
    } catch (error) {
      console.error('Error updating work order:', error);
      toast.error('Is emri guncellenemedi');
    }
  };

  const handleArchive = async () => {
    if (!user || !archiveWorkOrder) return;
    try {
      await workOrderService.archive(archiveWorkOrder.id, user.uid);
      toast.success('Is emri arsivlendi');
      setArchiveWorkOrder(null);
      loadData();
    } catch (error) {
      console.error('Error archiving work order:', error);
      toast.error('Is emri arsivlenemedi');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteWorkOrder) return;
    try {
      await workOrderService.delete(deleteWorkOrder.id);
      toast.success('Is emri silindi');
      setDeleteWorkOrder(null);
      loadData();
    } catch (error) {
      console.error('Error deleting work order:', error);
      toast.error('Is emri silinemedi');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Is Emirleri</h1>
          <p className="text-muted-foreground">
            Aktif is emirlerinizi yonetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Is Emri
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Is emri veya sirket ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as WorkOrderStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Durumlar</SelectItem>
            {WORK_ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {WORK_ORDER_STATUS_CONFIG[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredWorkOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? 'Arama kriterlerine uygun is emri bulunamadi'
              : 'Henuz is emri yok'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setFormOpen(true)}
            >
              Ilk is emrini olustur
            </Button>
          )}
        </div>
      ) : (
        <WorkOrderList
          workOrders={filteredWorkOrders}
          onEdit={(wo) => setEditingWorkOrder(wo)}
          onArchive={(wo) => setArchiveWorkOrder(wo)}
          onDelete={(wo) => setDeleteWorkOrder(wo)}
        />
      )}

      {/* Create Dialog */}
      <WorkOrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        companies={companies}
        deals={deals}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <WorkOrderFormDialog
        open={!!editingWorkOrder}
        onOpenChange={(open) => !open && setEditingWorkOrder(null)}
        workOrder={editingWorkOrder}
        companies={companies}
        deals={deals}
        onSubmit={handleUpdate}
      />

      {/* Archive Confirmation */}
      <AlertDialog open={!!archiveWorkOrder} onOpenChange={(open) => !open && setArchiveWorkOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Is Emrini Arsivle</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveWorkOrder?.title} is emrini arsivlemek istediginizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Arsivle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteWorkOrder} onOpenChange={(open) => !open && setDeleteWorkOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Is Emrini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWorkOrder?.title} is emrini silmek istediginizden emin misiniz?
              Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
