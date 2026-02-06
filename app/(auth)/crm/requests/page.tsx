'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
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
import { RequestList } from '@/components/crm/request-list';
import { RequestFormDialog } from '@/components/crm/request-form-dialog';
import { requestService } from '@/lib/firebase/requests';
import { useAuth } from '@/components/auth/auth-provider';
import { REQUEST_STATUSES } from '@/lib/types';
import { REQUEST_STATUS_CONFIG } from '@/lib/utils/status';
import type { Request, RequestFormData, RequestStatus } from '@/lib/types';
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

const ALL_VALUE = '__all__';

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL_VALUE);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<Request | null>(null);

  const loadRequests = async () => {
    try {
      const data = await requestService.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Talepler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      !searchTerm ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.companyName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.contactName ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === ALL_VALUE || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (data: RequestFormData) => {
    if (!user) return;
    try {
      await requestService.add(data, user.uid);
      toast.success('Talep oluşturuldu');
      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Talep oluşturulamadı');
    }
  };

  const handleUpdate = async (data: RequestFormData) => {
    if (!user || !editingRequest) return;
    try {
      await requestService.update(editingRequest.id, data, user.uid);
      toast.success('Talep güncellendi');
      setEditingRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Talep güncellenemedi');
    }
  };

  const handleStatusChange = async (request: Request, status: RequestStatus) => {
    if (!user) return;
    try {
      await requestService.updateStatus(request.id, status, user.uid);
      const statusLabel = REQUEST_STATUS_CONFIG[status].label;
      toast.success(`Talep durumu: ${statusLabel}`);
      loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteRequest) return;
    try {
      await requestService.delete(deleteRequest.id);
      toast.success('Talep silindi');
      setDeleteRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Talep silinemedi');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Talepler"
        description="İç ekip taleplerini yönetin"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Talep, şirket veya kişi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tüm Durumlar</SelectItem>
              {REQUEST_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {REQUEST_STATUS_CONFIG[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Talep
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground">Henüz talep yok</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setFormOpen(true)}
          >
            İlk talebi oluştur
          </Button>
        </div>
      ) : (
        <RequestList
          requests={filteredRequests}
          onEdit={(request) => setEditingRequest(request)}
          onDelete={(request) => setDeleteRequest(request)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create Dialog */}
      <RequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <RequestFormDialog
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        request={editingRequest}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRequest} onOpenChange={(open) => !open && setDeleteRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Talebi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteRequest?.title}&quot; talebini silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
