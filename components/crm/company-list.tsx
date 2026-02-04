'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Building2,
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarClock,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import type { ColumnDef } from '@tanstack/react-table';
import {
  TableProvider,
  TableHeader,
  TableHeaderGroup,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
} from '@/components/kibo-ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from './status-badge';
import { COMPANY_STATUS_CONFIG } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { Company } from '@/lib/types';

type CompanyListProps = {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
};

export function CompanyList({ companies, onEdit, onDelete }: CompanyListProps) {
  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Şirket" />
      ),
      cell: ({ row }) => {
        const company = row.original;
        const initials = company.name
          ? company.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((word) => word[0]?.toUpperCase() ?? '')
              .join('')
          : '';

        return (
          <Link
            href={`/crm/companies/${company.id}`}
            className="flex items-center gap-2 font-medium hover:text-primary"
          >
            <Avatar className="h-8 w-8">
              {company.logoUrl && (
                <AvatarImage src={company.logoUrl} alt={company.name} />
              )}
              <AvatarFallback>
                {initials || <Building2 className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            {company.name}
          </Link>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Durum',
      cell: ({ row }) => (
        <StatusBadge config={COMPANY_STATUS_CONFIG[row.original.status]} />
      ),
    },
    {
      accessorKey: 'nextAction',
      header: 'Sonraki Adim',
      cell: ({ row }) => {
        const { nextAction, nextActionDate } = row.original;
        if (!nextAction) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        const isOverdue =
          nextActionDate && nextActionDate.toDate() < new Date();

        return (
          <div className="flex items-center gap-2">
            <span className={cn(isOverdue && 'text-red-600 font-medium')}>
              {nextAction}
            </span>
            {nextActionDate && (
              <span
                className={cn(
                  'text-xs',
                  isOverdue ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                ({format(nextActionDate.toDate(), 'dd MMM', { locale: tr })})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'lastActivityAt',
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Son Aktivite" />
      ),
      cell: ({ row }) => {
        const date = row.original.lastActivityAt;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-sm text-muted-foreground">
            {format(date.toDate(), 'dd MMM yyyy', { locale: tr })}
          </span>
        );
      },
    },
    {
      accessorKey: 'tags',
      header: 'Etiketler',
      cell: ({ row }) => {
        const tags = row.original.tags;
        if (!tags || tags.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Duzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <TableProvider columns={columns} data={companies} className="border rounded-lg">
      <TableHeader>
        {({ headerGroup }) => (
          <TableHeaderGroup headerGroup={headerGroup}>
            {({ header }) => <TableHead header={header} />}
          </TableHeaderGroup>
        )}
      </TableHeader>
      <TableBody>
        {({ row }) => (
          <TableRow row={row}>
            {({ cell }) => <TableCell cell={cell} />}
          </TableRow>
        )}
      </TableBody>
    </TableProvider>
  );
}
