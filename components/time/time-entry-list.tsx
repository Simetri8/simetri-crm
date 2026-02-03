'use client';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Briefcase,
  Package,
  CheckSquare,
  DollarSign,
} from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDuration } from '@/lib/utils/status';
import { TIME_ENTRY_STATUS_CONFIG } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { TimeEntry } from '@/lib/types';

type TimeEntryListProps = {
  entries: TimeEntry[];
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entry: TimeEntry) => void;
  showWorkOrder?: boolean;
  groupByDate?: boolean;
};

export function TimeEntryList({
  entries,
  onEdit,
  onDelete,
  showWorkOrder = true,
  groupByDate = false,
}: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
        <Clock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Henuz zaman girisi yok</p>
      </div>
    );
  }

  // Group entries by date if needed
  const groupedEntries: Record<string, TimeEntry[]> = {};
  if (groupByDate) {
    entries.forEach((entry) => {
      const dateKey = format(entry.date.toDate(), 'yyyy-MM-dd');
      if (!groupedEntries[dateKey]) {
        groupedEntries[dateKey] = [];
      }
      groupedEntries[dateKey].push(entry);
    });
  }

  const renderEntry = (entry: TimeEntry) => (
    <TableRow key={entry.id}>
      {!groupByDate && (
        <TableCell className="font-medium">
          {format(entry.date.toDate(), 'dd MMM', { locale: tr })}
        </TableCell>
      )}
      {showWorkOrder && (
        <TableCell>
          {entry.workOrderTitle ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{entry.workOrderTitle}</span>
              </div>
              {entry.deliverableTitle && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
                  <Package className="h-3 w-3" />
                  <span>{entry.deliverableTitle}</span>
                </div>
              )}
              {entry.taskTitle && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
                  <CheckSquare className="h-3 w-3" />
                  <span>{entry.taskTitle}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatDuration(entry.durationMinutes)}</span>
        </div>
      </TableCell>
      <TableCell>
        {entry.billable ? (
          <Badge variant="secondary" className="text-xs">
            <DollarSign className="h-3 w-3 mr-1" />
            Faturalanabilir
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Dahili</span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge config={TIME_ENTRY_STATUS_CONFIG[entry.status]} className="text-xs" />
      </TableCell>
      <TableCell className="max-w-[200px]">
        {entry.note ? (
          <span className="text-sm text-muted-foreground truncate block">{entry.note}</span>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
      <TableCell>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {entry.status === 'approved' || entry.status === 'locked' ? 'Duzelt' : 'Duzenle'}
                </DropdownMenuItem>
              )}
              {onDelete && entry.status === 'draft' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(entry)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );

  if (groupByDate) {
    return (
      <div className="space-y-4">
        {Object.entries(groupedEntries)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([dateKey, dateEntries]) => {
            const date = new Date(dateKey);
            const totalMinutes = dateEntries.reduce((acc, e) => acc + e.durationMinutes, 0);

            return (
              <div key={dateKey} className="border rounded-lg">
                <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
                  <span className="font-medium">
                    {format(date, 'dd MMMM yyyy, EEEE', { locale: tr })}
                  </span>
                  <Badge variant="outline">
                    Toplam: {formatDuration(totalMinutes)}
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showWorkOrder && <TableHead>Is / Gorev</TableHead>}
                      <TableHead>Sure</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Not</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{dateEntries.map(renderEntry)}</TableBody>
                </Table>
              </div>
            );
          })}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarih</TableHead>
          {showWorkOrder && <TableHead>Is / Gorev</TableHead>}
          <TableHead>Sure</TableHead>
          <TableHead>Tip</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Not</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{entries.map(renderEntry)}</TableBody>
    </Table>
  );
}
