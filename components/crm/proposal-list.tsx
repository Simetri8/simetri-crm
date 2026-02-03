'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  FileText,
  Building2,
  Briefcase,
  MoreHorizontal,
  Eye,
  Copy,
  Send,
  CheckCircle,
  XCircle,
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
import { StatusBadge } from './status-badge';
import { PROPOSAL_STATUS_CONFIG, formatMoney } from '@/lib/utils/status';
import type { Proposal } from '@/lib/types';

type ProposalListProps = {
  proposals: Proposal[];
  onSend?: (proposal: Proposal) => void;
  onAccept?: (proposal: Proposal) => void;
  onReject?: (proposal: Proposal) => void;
  onNewVersion?: (proposal: Proposal) => void;
  onDelete?: (proposal: Proposal) => void;
};

export function ProposalList({
  proposals,
  onSend,
  onAccept,
  onReject,
  onNewVersion,
  onDelete,
}: ProposalListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Teklif</TableHead>
          <TableHead>Şirket / Firsat</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">Toplam</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <TableCell>
              <Link
                href={`/crm/proposals/${proposal.id}`}
                className="flex items-center gap-2 font-medium hover:text-primary"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span>{proposal.dealTitle}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    v{proposal.version}
                  </Badge>
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Link
                  href={`/crm/companies/${proposal.companyId}`}
                  className="flex items-center gap-1 text-sm hover:text-primary"
                >
                  <Building2 className="h-3 w-3" />
                  {proposal.companyName}
                </Link>
                <Link
                  href={`/crm/deals/${proposal.dealId}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <Briefcase className="h-3 w-3" />
                  {proposal.dealTitle}
                </Link>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge config={PROPOSAL_STATUS_CONFIG[proposal.status]} />
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatMoney(proposal.grandTotalMinor, proposal.currency)}
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {format(proposal.createdAt.toDate(), 'dd MMM yyyy', { locale: tr })}
              </div>
              {proposal.sentAt && (
                <div className="text-xs text-muted-foreground">
                  Gond: {format(proposal.sentAt.toDate(), 'dd MMM', { locale: tr })}
                </div>
              )}
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
                    <Link href={`/crm/proposals/${proposal.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Goruntule
                    </Link>
                  </DropdownMenuItem>
                  {proposal.status === 'draft' && onSend && (
                    <DropdownMenuItem onClick={() => onSend(proposal)}>
                      <Send className="mr-2 h-4 w-4" />
                      Gonder
                    </DropdownMenuItem>
                  )}
                  {proposal.status === 'sent' && (
                    <>
                      {onAccept && (
                        <DropdownMenuItem onClick={() => onAccept(proposal)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Kabul Edildi
                        </DropdownMenuItem>
                      )}
                      {onReject && (
                        <DropdownMenuItem onClick={() => onReject(proposal)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reddedildi
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {onNewVersion && (
                    <DropdownMenuItem onClick={() => onNewVersion(proposal)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Yeni Versiyon
                    </DropdownMenuItem>
                  )}
                  {onDelete && proposal.status === 'draft' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(proposal)}
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
        ))}
      </TableBody>
    </Table>
  );
}
