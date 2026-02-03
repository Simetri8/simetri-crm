'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Plus,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/crm/status-badge';
import { proposalService } from '@/lib/firebase/proposals';
import { catalogItemService } from '@/lib/firebase/catalog-items';
import { activityService } from '@/lib/firebase/activities';
import { useAuth } from '@/components/auth/auth-provider';
import { CURRENCIES, UNITS } from '@/lib/types';
import {
  PROPOSAL_STATUS_CONFIG,
  CURRENCY_CONFIG,
  UNIT_LABELS,
  formatMoney,
} from '@/lib/utils/status';
import type {
  Proposal,
  CatalogItem,
  Currency,
  Unit,
  ProposalFormDataItem,
} from '@/lib/types';

type LineItem = ProposalFormDataItem & {
  tempId: string;
};

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editCurrency, setEditCurrency] = useState<Currency>('TRY');
  const [editPricesIncludeTax, setEditPricesIncludeTax] = useState(true);
  const [editItems, setEditItems] = useState<LineItem[]>([]);
  const [catalogSearchOpen, setCatalogSearchOpen] = useState(false);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [acceptedByName, setAcceptedByName] = useState('');
  const [acceptanceNote, setAcceptanceNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [proposalData, catalogData] = await Promise.all([
          proposalService.getById(resolvedParams.id),
          catalogItemService.getActive(),
        ]);
        setProposal(proposalData);
        setCatalogItems(catalogData);

        if (proposalData) {
          // Initialize edit form
          setEditCurrency(proposalData.currency);
          setEditPricesIncludeTax(proposalData.pricesIncludeTax);
          setEditItems(
            proposalData.items.map((item, index) => ({
              ...item,
              tempId: `item-${index}`,
            }))
          );
        }
      } catch (error) {
        console.error('Error loading proposal:', error);
        toast.error('Teklif yuklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resolvedParams.id]);

  // Generate temp ID
  const generateTempId = () => Math.random().toString(36).substr(2, 9);

  // Edit handlers
  const handleAddCatalogItem = (item: CatalogItem) => {
    const newItem: LineItem = {
      tempId: generateTempId(),
      catalogItemId: item.id,
      title: item.name,
      description: item.description,
      quantity: 1,
      unit: item.unit,
      unitPriceMinor: item.defaultUnitPriceMinor,
      taxRate: item.taxRate,
    };
    setEditItems([...editItems, newItem]);
    setCatalogSearchOpen(false);
  };

  const handleAddCustomItem = () => {
    const newItem: LineItem = {
      tempId: generateTempId(),
      catalogItemId: null,
      title: '',
      description: null,
      quantity: 1,
      unit: 'piece',
      unitPriceMinor: 0,
      taxRate: 20,
    };
    setEditItems([...editItems, newItem]);
  };

  const handleUpdateItem = (tempId: string, field: keyof LineItem, value: unknown) => {
    setEditItems(
      editItems.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (tempId: string) => {
    setEditItems(editItems.filter((item) => item.tempId !== tempId));
  };

  // Calculate totals for edit mode
  const editTotals = useMemo(() => {
    let subtotalMinor = 0;
    let taxTotalMinor = 0;

    editItems.forEach((item) => {
      const lineTotal = item.unitPriceMinor * item.quantity;

      if (editPricesIncludeTax) {
        const taxMultiplier = 1 + item.taxRate / 100;
        const lineSubtotal = Math.round(lineTotal / taxMultiplier);
        const lineTax = lineTotal - lineSubtotal;
        subtotalMinor += lineSubtotal;
        taxTotalMinor += lineTax;
      } else {
        const lineTax = Math.round(lineTotal * (item.taxRate / 100));
        subtotalMinor += lineTotal;
        taxTotalMinor += lineTax;
      }
    });

    return {
      subtotalMinor,
      taxTotalMinor,
      grandTotalMinor: subtotalMinor + taxTotalMinor,
    };
  }, [editItems, editPricesIncludeTax]);

  // Save edits
  const handleSaveEdits = async () => {
    if (!user || !proposal) return;

    if (editItems.length === 0) {
      toast.error('En az bir kalem ekleyin');
      return;
    }

    const invalidItems = editItems.filter((item) => !item.title || item.unitPriceMinor <= 0);
    if (invalidItems.length > 0) {
      toast.error('Tum kalemlerin adi ve fiyati olmali');
      return;
    }

    setSaving(true);
    try {
      await proposalService.update(
        proposal.id,
        {
          items: editItems.map((item) => ({
            catalogItemId: item.catalogItemId,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceMinor: item.unitPriceMinor,
            taxRate: item.taxRate,
          })),
          currency: editCurrency,
          pricesIncludeTax: editPricesIncludeTax,
        },
        user.uid
      );
      toast.success('Teklif guncellendi');
      setIsEditing(false);
      // Reload proposal
      const updated = await proposalService.getById(proposal.id);
      setProposal(updated);
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Teklif guncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    if (proposal) {
      setEditCurrency(proposal.currency);
      setEditPricesIncludeTax(proposal.pricesIncludeTax);
      setEditItems(
        proposal.items.map((item, index) => ({
          ...item,
          tempId: `item-${index}`,
        }))
      );
    }
    setIsEditing(false);
  };

  // Actions
  const handleSend = async () => {
    if (!user || !proposal) return;
    setActionLoading(true);
    try {
      await proposalService.markAsSent(proposal.id, user.uid);
      await activityService.addSystemActivity(
        'proposal_sent',
        `Teklif gonderildi: v${proposal.version}`,
        { dealId: proposal.dealId, companyId: proposal.companyId },
        user.uid
      );
      toast.success('Teklif gonderildi olarak isaretlendi');
      const updated = await proposalService.getById(proposal.id);
      setProposal(updated);
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast.error('Islem basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !proposal) return;
    setActionLoading(true);
    try {
      await proposalService.markAsAccepted(
        proposal.id,
        acceptedByName,
        acceptanceNote || null,
        user.uid
      );
      await activityService.addSystemActivity(
        'proposal_accepted',
        `Teklif kabul edildi: v${proposal.version} - ${acceptedByName}`,
        { dealId: proposal.dealId, companyId: proposal.companyId },
        user.uid
      );
      toast.success('Teklif kabul edildi olarak isaretlendi');
      setShowAcceptDialog(false);
      const updated = await proposalService.getById(proposal.id);
      setProposal(updated);
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Islem basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user || !proposal) return;
    setActionLoading(true);
    try {
      await proposalService.markAsRejected(proposal.id, user.uid);
      await activityService.addSystemActivity(
        'proposal_rejected',
        `Teklif reddedildi: v${proposal.version}`,
        { dealId: proposal.dealId, companyId: proposal.companyId },
        user.uid
      );
      toast.success('Teklif reddedildi olarak isaretlendi');
      const updated = await proposalService.getById(proposal.id);
      setProposal(updated);
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Islem basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNewVersion = async () => {
    if (!user || !proposal) return;
    setActionLoading(true);
    try {
      const newId = await proposalService.createNewVersion(proposal.id, user.uid);
      toast.success('Yeni versiyon olusturuldu');
      router.push(`/crm/proposals/${newId}`);
    } catch (error) {
      console.error('Error creating new version:', error);
      toast.error('Yeni versiyon olusturulamadi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !proposal) return;
    setActionLoading(true);
    try {
      await proposalService.delete(proposal.id);
      toast.success('Teklif silindi');
      router.push('/crm/proposals');
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Teklif silinemedi');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Teklif bulunamadi</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/crm/proposals">Tekliflere don</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/crm/proposals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{proposal.dealTitle}</h1>
              <Badge variant="outline">v{proposal.version}</Badge>
              <StatusBadge config={PROPOSAL_STATUS_CONFIG[proposal.status]} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <Link
                href={`/crm/companies/${proposal.companyId}`}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Building2 className="h-3 w-3" />
                {proposal.companyName}
              </Link>
              <Link
                href={`/crm/deals/${proposal.dealId}`}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Briefcase className="h-3 w-3" />
                Firsata Git
              </Link>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {proposal.status === 'draft' && !isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Duzenle
              </Button>
              <Button onClick={handleSend} disabled={actionLoading}>
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Gonder
              </Button>
            </>
          )}
          {proposal.status === 'sent' && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowAcceptDialog(true)}
                disabled={actionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Kabul Edildi
              </Button>
              <Button variant="outline" onClick={handleReject} disabled={actionLoading}>
                <XCircle className="mr-2 h-4 w-4" />
                Reddedildi
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleNewVersion} disabled={actionLoading}>
            <Copy className="mr-2 h-4 w-4" />
            Yeni Versiyon
          </Button>
          {proposal.status === 'draft' && (
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600"
              onClick={() => setShowDeleteDialog(true)}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ara Toplam</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatMoney(proposal.subtotalMinor, proposal.currency)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>KDV</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatMoney(proposal.taxTotalMinor, proposal.currency)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Genel Toplam</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-primary">
              {formatMoney(proposal.grandTotalMinor, proposal.currency)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tarih</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <span className="text-sm">
                Olusturuldu: {format(proposal.createdAt.toDate(), 'dd MMM yyyy', { locale: tr })}
              </span>
            </div>
            {proposal.sentAt && (
              <div className="text-xs text-muted-foreground">
                Gonderildi: {format(proposal.sentAt.toDate(), 'dd MMM yyyy', { locale: tr })}
              </div>
            )}
            {proposal.acceptedAt && (
              <div className="text-xs text-green-600">
                Kabul: {format(proposal.acceptedAt.toDate(), 'dd MMM yyyy', { locale: tr })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acceptance Info */}
      {proposal.acceptedByName && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Kabul Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <p>
              <strong>Onaylayan:</strong> {proposal.acceptedByName}
            </p>
            {proposal.acceptanceNote && (
              <p className="mt-1">
                <strong>Not:</strong> {proposal.acceptanceNote}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items - View Mode */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Teklif Kalemleri</CardTitle>
            <CardDescription>
              {proposal.pricesIncludeTax ? 'Fiyatlar KDV dahil' : 'Fiyatlar KDV haric'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Kalem</TableHead>
                  <TableHead className="text-center">Miktar</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">KDV %</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposal.items.map((item, index) => {
                  const lineTotal = item.unitPriceMinor * item.quantity;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.title}</span>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell>{UNIT_LABELS[item.unit]}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(item.unitPriceMinor, proposal.currency)}
                      </TableCell>
                      <TableCell className="text-right">%{item.taxRate}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(lineTotal, proposal.currency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Items - Edit Mode */}
      {isEditing && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Teklif Kalemlerini Duzenle</CardTitle>
              <CardDescription>
                Katalogdan veya ozel kalem ekleyin
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover open={catalogSearchOpen} onOpenChange={setCatalogSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    Katalogdan Ekle
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Katalogda ara..." />
                    <CommandList>
                      <CommandEmpty>Kalem bulunamadi</CommandEmpty>
                      <CommandGroup>
                        {catalogItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.id}
                            onSelect={() => handleAddCatalogItem(item)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatMoney(item.defaultUnitPriceMinor, item.currency)} /{' '}
                                {UNIT_LABELS[item.unit]}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={handleAddCustomItem}>
                <Plus className="mr-2 h-4 w-4" />
                Ozel Kalem
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select
                  value={editCurrency}
                  onValueChange={(v) => setEditCurrency(v as Currency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CURRENCY_CONFIG[c].symbol} - {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Fiyatlar KDV Dahil</Label>
                </div>
                <Switch
                  checked={editPricesIncludeTax}
                  onCheckedChange={setEditPricesIncludeTax}
                />
              </div>
            </div>

            <Separator />

            {/* Items Table */}
            {editItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center border-2 border-dashed rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Henuz kalem eklenmedi</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Kalem</TableHead>
                    <TableHead className="w-[15%]">Miktar</TableHead>
                    <TableHead className="w-[15%]">Birim</TableHead>
                    <TableHead className="w-[15%] text-right">Birim Fiyat</TableHead>
                    <TableHead className="w-[10%] text-right">KDV %</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editItems.map((item) => (
                    <TableRow key={item.tempId}>
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            value={item.title}
                            onChange={(e) =>
                              handleUpdateItem(item.tempId, 'title', e.target.value)
                            }
                            placeholder="Kalem adi"
                            className="h-8"
                          />
                          <Textarea
                            value={item.description || ''}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.tempId,
                                'description',
                                e.target.value || null
                              )
                            }
                            placeholder="Aciklama (opsiyonel)"
                            className="h-14 resize-none text-xs"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.tempId,
                              'quantity',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.unit}
                          onValueChange={(v) =>
                            handleUpdateItem(item.tempId, 'unit', v as Unit)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {UNIT_LABELS[unit]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.unitPriceMinor / 100}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.tempId,
                              'unitPriceMinor',
                              Math.round(parseFloat(e.target.value) * 100) || 0
                            )
                          }
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.taxRate}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.tempId,
                              'taxRate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveItem(item.tempId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totals */}
            {editItems.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ara Toplam:</span>
                      <span>{formatMoney(editTotals.subtotalMinor, editCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">KDV:</span>
                      <span>{formatMoney(editTotals.taxTotalMinor, editCurrency)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Genel Toplam:</span>
                      <span>{formatMoney(editTotals.grandTotalMinor, editCurrency)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Edit Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                Iptal
              </Button>
              <Button onClick={handleSaveEdits} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teklifi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu teklifi silmek istediginizden emin misiniz? Bu islem geri alinamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
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
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Iptal
            </Button>
            <Button onClick={handleAccept} disabled={!acceptedByName || actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
