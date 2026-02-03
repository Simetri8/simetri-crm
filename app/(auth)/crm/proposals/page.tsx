'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProposalList } from '@/components/crm/proposal-list';
import { proposalService } from '@/lib/firebase/proposals';
import { activityService } from '@/lib/firebase/activities';
import { useAuth } from '@/components/auth/auth-provider';
import { PROPOSAL_STATUSES } from '@/lib/types';
import { PROPOSAL_STATUS_CONFIG } from '@/lib/utils/status';
import type { Proposal, ProposalStatus } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');

  // Dialog states
  const [deleteProposal, setDeleteProposal] = useState<Proposal | null>(null);
  const [acceptProposal, setAcceptProposal] = useState<Proposal | null>(null);
  const [acceptedByName, setAcceptedByName] = useState('');
  const [acceptanceNote, setAcceptanceNote] = useState('');

  const loadProposals = async () => {
    try {
      const data = await proposalService.getAll({ isArchived: false });
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast.error('Teklifler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.dealTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSend = async (proposal: Proposal) => {
    if (!user) return;
    try {
      await proposalService.markAsSent(proposal.id, user.uid);

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'proposal_sent',
        `Teklif gonderildi: v${proposal.version}`,
        { dealId: proposal.dealId, companyId: proposal.companyId },
        user.uid
      );

      toast.success('Teklif gonderildi olarak isaretlendi');
      loadProposals();
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast.error('Islem basarisiz');
    }
  };

  const handleAccept = async () => {
    if (!user || !acceptProposal) return;
    try {
      await proposalService.markAsAccepted(
        acceptProposal.id,
        acceptedByName,
        acceptanceNote || null,
        user.uid
      );

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'proposal_accepted',
        `Teklif kabul edildi: v${acceptProposal.version} - ${acceptedByName}`,
        { dealId: acceptProposal.dealId, companyId: acceptProposal.companyId },
        user.uid
      );

      toast.success('Teklif kabul edildi olarak isaretlendi');
      setAcceptProposal(null);
      setAcceptedByName('');
      setAcceptanceNote('');
      loadProposals();
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Islem basarisiz');
    }
  };

  const handleReject = async (proposal: Proposal) => {
    if (!user) return;
    try {
      await proposalService.markAsRejected(proposal.id, user.uid);

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'proposal_rejected',
        `Teklif reddedildi: v${proposal.version}`,
        { dealId: proposal.dealId, companyId: proposal.companyId },
        user.uid
      );

      toast.success('Teklif reddedildi olarak isaretlendi');
      loadProposals();
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Islem basarisiz');
    }
  };

  const handleNewVersion = async (proposal: Proposal) => {
    if (!user) return;
    try {
      const newId = await proposalService.createNewVersion(proposal.id, user.uid);
      toast.success('Yeni versiyon olusturuldu');
      // Yeni versiyona yonlendir
      window.location.href = `/crm/proposals/${newId}`;
    } catch (error) {
      console.error('Error creating new version:', error);
      toast.error('Yeni versiyon olusturulamadi');
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteProposal) return;
    try {
      await proposalService.delete(deleteProposal.id);
      toast.success('Teklif silindi');
      setDeleteProposal(null);
      loadProposals();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Teklif silinemedi');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Teklifler</h1>
          <p className="text-muted-foreground">
            Satis tekliflerinizi yonetin
          </p>
        </div>
        <Button asChild>
          <Link href="/crm/proposals/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Teklif
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Teklif veya sirket ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProposalStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Durumlar</SelectItem>
            {PROPOSAL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {PROPOSAL_STATUS_CONFIG[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? 'Arama kriterlerine uygun teklif bulunamadi'
              : 'Henuz teklif yok'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button asChild variant="link" className="mt-2">
              <Link href="/crm/proposals/new">Ilk teklifi olustur</Link>
            </Button>
          )}
        </div>
      ) : (
        <ProposalList
          proposals={filteredProposals}
          onSend={handleSend}
          onAccept={(proposal) => setAcceptProposal(proposal)}
          onReject={handleReject}
          onNewVersion={handleNewVersion}
          onDelete={(proposal) => setDeleteProposal(proposal)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProposal} onOpenChange={(open) => !open && setDeleteProposal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teklifi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu teklifi silmek istediginizden emin misiniz?
              Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Dialog */}
      <Dialog open={!!acceptProposal} onOpenChange={(open) => !open && setAcceptProposal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teklif Kabulu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Onaylayan Kisi</Label>
              <Input
                placeholder="Musteri adi"
                value={acceptedByName}
                onChange={(e) => setAcceptedByName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Not (Opsiyonel)</Label>
              <Textarea
                placeholder="Kabul notu..."
                value={acceptanceNote}
                onChange={(e) => setAcceptanceNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptProposal(null)}>
              Iptal
            </Button>
            <Button onClick={handleAccept} disabled={!acceptedByName}>
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
