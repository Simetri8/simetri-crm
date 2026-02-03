'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Briefcase,
  Building2,
  Calendar,
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  Trash2,
  AlertTriangle,
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
import { StatusBadge } from '@/components/crm/status-badge';
import {
  WORK_ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { WorkOrder } from '@/lib/types';

type WorkOrderListProps = {
  workOrders: WorkOrder[];
  onEdit?: (workOrder: WorkOrder) => void;
  onArchive?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrder: WorkOrder) => void;
};

export function WorkOrderList({
  workOrders,
  onEdit,
  onArchive,
  onDelete,
}: WorkOrderListProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = (wo: WorkOrder) => {
    const targetDate = wo.targetDeliveryDate.toDate();
    return targetDate < today && wo.status !== 'completed' && wo.status !== 'cancelled';
  };

  const isDueSoon = (wo: WorkOrder) => {
    const targetDate = wo.targetDeliveryDate.toDate();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    return (
      targetDate >= today &&
      targetDate <= sevenDaysLater &&
      wo.status !== 'completed' &&
      wo.status !== 'cancelled'
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Is Emri</TableHead>
          <TableHead>Sirket</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Odeme</TableHead>
          <TableHead>Hedef Teslim</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workOrders.map((wo) => {
          const overdue = isOverdue(wo);
          const dueSoon = isDueSoon(wo);

          return (
            <TableRow
              key={wo.id}
              className={cn(overdue && 'bg-red-50', dueSoon && !overdue && 'bg-amber-50')}
            >
              <TableCell>
                <Link
                  href={`/ops/work-orders/${wo.id}`}
                  className="flex items-center gap-2 font-medium hover:text-primary"
                >
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span>{wo.title}</span>
                    {wo.dealTitle && (
                      <p className="text-xs text-muted-foreground">{wo.dealTitle}</p>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/crm/companies/${wo.companyId}`}
                  className="flex items-center gap-1 text-sm hover:text-primary"
                >
                  <Building2 className="h-3 w-3" />
                  {wo.companyName}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge config={WORK_ORDER_STATUS_CONFIG[wo.status]} />
              </TableCell>
              <TableCell>
                <StatusBadge config={PAYMENT_STATUS_CONFIG[wo.paymentStatus]} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {overdue && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  {dueSoon && !overdue && (
                    <Calendar className="h-4 w-4 text-amber-500" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      overdue && 'text-red-600 font-medium',
                      dueSoon && !overdue && 'text-amber-600'
                    )}
                  >
                    {format(wo.targetDeliveryDate.toDate(), 'dd MMM yyyy', {
                      locale: tr,
                    })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Islemler</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/ops/work-orders/${wo.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Goruntule
                      </Link>
                    </DropdownMenuItem>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(wo)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Duzenle
                      </DropdownMenuItem>
                    )}
                    {onArchive && wo.status !== 'completed' && wo.status !== 'cancelled' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onArchive(wo)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Arsivle
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(wo)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </>
                    )}
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
