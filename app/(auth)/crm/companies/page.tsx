'use client';

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompanyList } from '@/components/crm/company-list';
import { CompanyFormDialog } from '@/components/crm/company-form-dialog';
import { companyService } from '@/lib/firebase/companies';
import { useAuth } from '@/components/auth/auth-provider';
import type { Company, CompanyFormData } from '@/lib/types';
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

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAll({ isArchived: false });
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Şirketler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: CompanyFormData) => {
    if (!user) return;
    try {
      await companyService.add(data, user.uid);
      toast.success('Şirket oluşturuldu');
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Şirket oluşturulamadı');
    }
  };

  const handleUpdate = async (data: CompanyFormData) => {
    if (!user || !editingCompany) return;
    try {
      await companyService.update(editingCompany.id, data, user.uid);
      toast.success('Şirket güncellendi');
      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Şirket güncellenemedi');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteCompany) return;
    try {
      await companyService.archive(deleteCompany.id, user.uid);
      toast.success('Şirket silindi');
      setDeleteCompany(null);
      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Şirket silinemedi');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Şirketler"
        description="Müşteri şirketlerini yönetin"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Şirket ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Şirket
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground">Henüz şirket yok</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setFormOpen(true)}
          >
            İlk şirketi ekle
          </Button>
        </div>
      ) : (
        <CompanyList
          companies={filteredCompanies}
          onEdit={(company) => setEditingCompany(company)}
          onDelete={(company) => setDeleteCompany(company)}
        />
      )}

      {/* Create Dialog */}
      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <CompanyFormDialog
        open={!!editingCompany}
        onOpenChange={(open) => !open && setEditingCompany(null)}
        company={editingCompany}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCompany} onOpenChange={(open) => !open && setDeleteCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şirketi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCompany?.name} şirketini silmek istediğinizden emin misiniz?
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
