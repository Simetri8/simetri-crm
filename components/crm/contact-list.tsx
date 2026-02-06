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
          <TableHead>Ad Soyad</TableHead>
          <TableHead>Aşama</TableHead>
          <TableHead>Unvan</TableHead>
          {showCompany && <TableHead>Şirket</TableHead>}
          <TableHead>İletişim</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => {
          const stageConfig = CONTACT_STAGE_CONFIG[contact.stage ?? "new"];
          return (
            <TableRow key={contact.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{contact.fullName}</span>
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
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(stageConfig.bgColor, stageConfig.color)}
                >
                  {stageConfig.label}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {contact.title || '-'}
                </span>
              </TableCell>
              {showCompany && (
                <TableCell>
                  {contact.companyId && contact.companyName ? (
                    <Link
                      href={`/crm/companies/${contact.companyId}`}
                      className="flex items-center gap-1 text-sm hover:underline"
                    >
                      <Building2 className="h-3 w-3" />
                      {contact.companyName}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex flex-col gap-1">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </a>
                  )}
                  {!contact.email && !contact.phone && (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
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
