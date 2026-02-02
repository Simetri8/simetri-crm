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
      toast.error('Sirketler yuklenemedi');
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
      toast.success('Sirket olusturuldu');
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Sirket olusturulamadi');
    }
  };

  const handleUpdate = async (data: CompanyFormData) => {
    if (!user || !editingCompany) return;
    try {
      await companyService.update(editingCompany.id, data, user.uid);
      toast.success('Sirket guncellendi');
      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Sirket guncellenemedi');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteCompany) return;
    try {
      await companyService.archive(deleteCompany.id, user.uid);
      toast.success('Sirket silindi');
      setDeleteCompany(null);
      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Sirket silinemedi');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sirketler</h1>
          <p className="text-muted-foreground">
            Musteri sirketlerini yonetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Sirket
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sirket ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground">Henuz sirket yok</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setFormOpen(true)}
          >
            Ilk sirketi ekle
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
            <AlertDialogTitle>Sirketi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCompany?.name} sirketini silmek istediginizden emin misiniz?
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
