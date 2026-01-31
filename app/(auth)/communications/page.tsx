'use client';

import { useState } from 'react';
import { CommunicationList } from '@/components/communications/communication-list';
import { CommunicationFormDialog } from '@/components/communications/communication-form-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Communication } from '@/lib/types';

export default function CommunicationsPage() {
  const [open, setOpen] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (communication: Communication) => {
    setSelectedCommunication(communication);
    setOpen(true);
  };

  const handleAdd = () => {
    setSelectedCommunication(null);
    setOpen(true);
  };

  const onSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Iletisim Kayitlari</h2>
          <p className="text-muted-foreground">
            Tum musteri gorusmeleri buradan yonetilir.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Gorusme
        </Button>
      </div>

      <CommunicationList onEdit={handleEdit} refreshKey={refreshKey} />

      <CommunicationFormDialog
        open={open}
        onOpenChange={setOpen}
        communication={selectedCommunication}
        onSuccess={onSuccess}
      />
    </div>
  );
}
