'use client';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Play,
  Building2,
  UserCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  REQUEST_TYPE_LABELS,
  REQUEST_PRIORITY_CONFIG,
  REQUEST_STATUS_CONFIG,
} from '@/lib/utils/status';
import type { Request, RequestStatus } from '@/lib/types';

type RequestListProps = {
  requests: Request[];
  onEdit: (request: Request) => void;
  onDelete: (request: Request) => void;
  onStatusChange: (request: Request, status: RequestStatus) => void;
};

export function RequestList({
  requests,
  onEdit,
  onDelete,
  onStatusChange,
}: RequestListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Başlık</TableHead>
          <TableHead>Tür</TableHead>
          <TableHead>Öncelik</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Bağlam</TableHead>
          <TableHead>Atanan</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => {
          const priorityConfig = REQUEST_PRIORITY_CONFIG[request.priority];
          const statusConfig = REQUEST_STATUS_CONFIG[request.status];
          const isOpen = request.status === 'open' || request.status === 'in-progress';

          return (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <span className="font-medium">{request.title}</span>
                  {request.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {request.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {REQUEST_TYPE_LABELS[request.type]}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(priorityConfig.bgColor, priorityConfig.color)}
                >
                  {priorityConfig.label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(statusConfig.bgColor, statusConfig.color)}
                >
                  {statusConfig.label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  {request.contactName && (
                    <span className="flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      {request.contactName}
                    </span>
                  )}
                  {request.companyName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {request.companyName}
                    </span>
                  )}
                  {!request.contactName && !request.companyName && '-'}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {request.assigneeName || '-'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs text-muted-foreground">
                  {request.dueDate && (
                    <span>
                      Son: {format(request.dueDate.toDate(), 'dd MMM', { locale: tr })}
                    </span>
                  )}
                  <span>
                    {format(request.createdAt.toDate(), 'dd MMM yyyy', { locale: tr })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">İşlemler</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(request)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    {request.status === 'open' && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(request, 'in-progress')}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Başla
                      </DropdownMenuItem>
                    )}
                    {isOpen && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(request, 'done')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Tamamla
                      </DropdownMenuItem>
                    )}
                    {isOpen && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(request, 'cancelled')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        İptal Et
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(request)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
