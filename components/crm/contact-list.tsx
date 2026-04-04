'use client';

import Link from 'next/link';
import {
  Building2,
  Mail,
  Phone,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
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
import { CONTACT_STAGE_CONFIG, CONTACT_SOURCE_LABELS } from '@/lib/utils/status';
import type { Contact } from '@/lib/types';

type ContactListProps = {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  showCompany?: boolean;
};

export function ContactList({
  contacts,
  onEdit,
  onDelete,
  showCompany = true,
}: ContactListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-40 max-w-56 whitespace-normal">
            Ad Soyad
          </TableHead>
          <TableHead className="whitespace-nowrap">Aşama</TableHead>
          <TableHead className="max-w-44 whitespace-normal">Ünvan</TableHead>
          {showCompany && (
            <TableHead className="max-w-48 whitespace-normal">Şirket</TableHead>
          )}
          <TableHead className="max-w-64 whitespace-normal">İletişim</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => {
          const stageConfig = CONTACT_STAGE_CONFIG[contact.stage ?? "new"];
          return (
            <TableRow key={contact.id}>
              <TableCell className="min-w-0 max-w-56 whitespace-normal align-top">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 wrap-break-word font-medium">{contact.fullName}</span>
                  {contact.isPrimary && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      <Star className="mr-1 h-3 w-3" />
                      Birincil
                    </Badge>
                  )}
                </div>
                {contact.source && (
                  <span className="text-xs text-muted-foreground">
                    {CONTACT_SOURCE_LABELS[contact.source]}
                    {contact.sourceDetail ? ` · ${contact.sourceDetail}` : ''}
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap align-top">
                <Badge
                  variant="secondary"
                  className={cn(stageConfig.bgColor, stageConfig.color)}
                >
                  {stageConfig.label}
                </Badge>
              </TableCell>
              <TableCell className="max-w-44 min-w-0 whitespace-normal align-top">
                <span className="wrap-break-word text-muted-foreground">
                  {contact.title || '-'}
                </span>
              </TableCell>
              {showCompany && (
                <TableCell className="max-w-48 min-w-0 whitespace-normal align-top">
                  {contact.companyId && contact.companyName ? (
                    <Link
                      href={`/crm/companies/${contact.companyId}`}
                      className="inline-flex items-start gap-1 wrap-break-word text-sm hover:underline"
                    >
                      <Building2 className="mt-0.5 h-3 w-3 shrink-0" />
                      {contact.companyName}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell className="max-w-64 min-w-0 whitespace-normal align-top">
                <div className="flex flex-col gap-1">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex items-start gap-1 break-all text-sm text-muted-foreground hover:text-primary"
                    >
                      <Mail className="mt-0.5 h-3 w-3 shrink-0" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-start gap-1 break-all text-sm text-muted-foreground hover:text-primary"
                    >
                      <Phone className="mt-0.5 h-3 w-3 shrink-0" />
                      {contact.phone}
                    </a>
                  )}
                  {!contact.email && !contact.phone && (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap align-top">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">İşlemler</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contact)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(contact)}
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
