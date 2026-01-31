'use client';

import { useEffect, useState } from 'react';
import { Communication } from '@/lib/types';
import { communicationService } from '@/lib/firebase/communications';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Mail, Users, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COMMUNICATION_TYPE_LABELS } from '@/lib/utils/communication';

interface CommunicationListProps {
  onEdit: (communication: Communication) => void;
  refreshKey?: number;
  customerId?: string;
}

const typeIcons = {
  phone: Phone,
  email: Mail,
  meeting: Users,
  other: MessageSquare,
};

export function CommunicationList({ onEdit, refreshKey, customerId }: CommunicationListProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunications();
  }, [refreshKey, customerId]);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      let data: Communication[];
      if (customerId) {
        data = await communicationService.getByCustomer(customerId);
      } else {
        data = await communicationService.getAll();
      }
      setCommunications(data);
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu gorusmeyi silmek istediginizden emin misiniz?')) {
      await communicationService.delete(id);
      loadCommunications();
    }
  };

  if (loading) {
    return <div>Yukleniyor...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tip</TableHead>
            <TableHead>Musteri</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>Ozet</TableHead>
            <TableHead>Sonraki Adim</TableHead>
            <TableHead className="text-right">Islemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {communications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10">
                Hic gorusme bulunamadi.
              </TableCell>
            </TableRow>
          ) : (
            communications.map((comm) => {
              const Icon = typeIcons[comm.type];
              return (
                <TableRow key={comm.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{COMMUNICATION_TYPE_LABELS[comm.type]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{comm.customerName}</TableCell>
                  <TableCell>
                    {format(comm.date.toDate(), 'd MMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{comm.summary}</TableCell>
                  <TableCell>
                    {comm.nextAction ? (
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-[150px]">{comm.nextAction}</span>
                        {comm.nextActionDate && (
                          <span className="text-xs text-muted-foreground">
                            {format(comm.nextActionDate.toDate(), 'd MMM', { locale: tr })}
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(comm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => comm.id && handleDelete(comm.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
