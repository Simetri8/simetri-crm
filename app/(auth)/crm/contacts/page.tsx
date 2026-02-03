'use client';

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactList } from '@/components/crm/contact-list';
import { ContactFormDialog } from '@/components/crm/contact-form-dialog';
import { contactService } from '@/lib/firebase/contacts';
import { useAuth } from '@/components/auth/auth-provider';
import type { Contact, ContactFormData } from '@/lib/types';
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

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const loadContacts = async () => {
    try {
      const data = await contactService.getAll();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Kişiler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: ContactFormData) => {
    if (!user) return;
    try {
      await contactService.add(data, user.uid);
      toast.success('Kişi oluşturuldu');
      loadContacts();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Kişi oluşturulamadı');
    }
  };

  const handleUpdate = async (data: ContactFormData) => {
    if (!user || !editingContact) return;
    try {
      await contactService.update(editingContact.id, data, user.uid);
      toast.success('Kişi güncellendi');
      setEditingContact(null);
      loadContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Kişi güncellenemedi');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteContact) return;
    try {
      await contactService.delete(deleteContact.id);
      toast.success('Kişi silindi');
      setDeleteContact(null);
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Kişi silinemedi');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kişiler</h1>
          <p className="text-muted-foreground">
            Müşteri kişilerini yönetin
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kişi
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kişi, şirket veya e-posta ara..."
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
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground">Henüz kişi yok</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setFormOpen(true)}
          >
            İlk kişiyi ekle
          </Button>
        </div>
      ) : (
        <ContactList
          contacts={filteredContacts}
          onEdit={(contact) => setEditingContact(contact)}
          onDelete={(contact) => setDeleteContact(contact)}
        />
      )}

      {/* Create Dialog */}
      <ContactFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <ContactFormDialog
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
        contact={editingContact}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation */}
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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
