'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Package } from 'lucide-react';
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
import { CatalogItemList } from '@/components/crm/catalog-item-list';
import { CatalogItemFormDialog } from '@/components/crm/catalog-item-form-dialog';
import { catalogItemService } from '@/lib/firebase/catalog-items';
import { useAuth } from '@/components/auth/auth-provider';
import { CATALOG_ITEM_TYPES } from '@/lib/types';
import { CATALOG_ITEM_TYPE_LABELS } from '@/lib/utils/status';
import type { CatalogItem, CatalogItemFormData, CatalogItemType } from '@/lib/types';
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

export default function CatalogPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatalogItemType | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<CatalogItem | null>(null);

  const loadItems = async () => {
    try {
      const data = await catalogItemService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error loading catalog items:', error);
      toast.error('Katalog yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = async (data: CatalogItemFormData) => {
    if (!user) return;
    try {
      await catalogItemService.add(data, user.uid);
      toast.success('Kalem oluşturuldu');
      loadItems();
    } catch (error) {
      console.error('Error creating catalog item:', error);
      toast.error('Kalem oluşturulamadı');
    }
  };

  const handleUpdate = async (data: CatalogItemFormData) => {
    if (!user || !editingItem) return;
    try {
      await catalogItemService.update(editingItem.id, data, user.uid);
      toast.success('Kalem güncellendi');
      setEditingItem(null);
      loadItems();
    } catch (error) {
      console.error('Error updating catalog item:', error);
      toast.error('Kalem güncellenemedi');
    }
  };

  const handleToggleActive = async (item: CatalogItem) => {
    if (!user) return;
    try {
      await catalogItemService.setActive(item.id, !item.isActive, user.uid);
      toast.success(item.isActive ? 'Kalem pasif yapıldı' : 'Kalem aktif yapıldı');
      loadItems();
    } catch (error) {
      console.error('Error toggling catalog item:', error);
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteItem) return;
    try {
      await catalogItemService.delete(deleteItem.id);
      toast.success('Kalem silindi');
      setDeleteItem(null);
      loadItems();
    } catch (error) {
      console.error('Error deleting catalog item:', error);
      toast.error('Kalem silinemedi');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Katalog</h1>
          <p className="text-muted-foreground">
            Hizmet ve ürün kataloğunuzu yönetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kalem
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kalem ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as CatalogItemType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tür filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            {CATALOG_ITEM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {CATALOG_ITEM_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || typeFilter !== 'all'
              ? 'Arama kriterlerine uygun kalem bulunamadı'
              : 'Henüz katalog kalemi yok'}
          </p>
          {!searchTerm && typeFilter === 'all' && (
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setFormOpen(true)}
            >
              İlk kalemi ekle
            </Button>
          )}
        </div>
      ) : (
        <CatalogItemList
          items={filteredItems}
          onEdit={(item) => setEditingItem(item)}
          onDelete={(item) => setDeleteItem(item)}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Create Dialog */}
      <CatalogItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <CatalogItemFormDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kalemi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.name} kalemini silmek istediğinizden emin misiniz?
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
