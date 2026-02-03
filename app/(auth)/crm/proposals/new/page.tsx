'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Search,
  Loader2,
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
import { Separator } from '@/components/ui/separator';
import { dealService } from '@/lib/firebase/deals';
import { catalogItemService } from '@/lib/firebase/catalog-items';
import { proposalService } from '@/lib/firebase/proposals';
import { activityService } from '@/lib/firebase/activities';
import { useAuth } from '@/components/auth/auth-provider';
import { CURRENCIES, UNITS } from '@/lib/types';
import {
  CURRENCY_CONFIG,
  UNIT_LABELS,
  formatMoney,
} from '@/lib/utils/status';
import type {
  Deal,
  CatalogItem,
  Currency,
  Unit,
  ProposalFormDataItem,
} from '@/lib/types';

type LineItem = ProposalFormDataItem & {
  tempId: string; // UI icin gecici ID
};

export default function NewProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const preselectedDealId = searchParams.get('dealId');

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [dealSearchOpen, setDealSearchOpen] = useState(false);
  const [catalogSearchOpen, setCatalogSearchOpen] = useState(false);

  // Form state
  const [selectedDealId, setSelectedDealId] = useState<string>(preselectedDealId || '');
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [pricesIncludeTax, setPricesIncludeTax] = useState(true);
  const [items, setItems] = useState<LineItem[]>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [dealsData, catalogData] = await Promise.all([
          dealService.getActivePipeline(),
          catalogItemService.getActive(),
        ]);
        setDeals(dealsData);
        setCatalogItems(catalogData);

        // Eger preselected deal varsa currency'sini al
        if (preselectedDealId) {
          const deal = dealsData.find((d) => d.id === preselectedDealId);
          if (deal) {
            setCurrency(deal.currency);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Veriler yuklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [preselectedDealId]);

  // Selected deal
  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  // Generate temp ID
  const generateTempId = () => Math.random().toString(36).substr(2, 9);

  // Add catalog item
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
    setItems([...items, newItem]);
    setCatalogSearchOpen(false);
  };

  // Add custom item
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
    setItems([...items, newItem]);
  };

  // Update item
  const handleUpdateItem = (tempId: string, field: keyof LineItem, value: unknown) => {
    setItems(
      items.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  // Remove item
  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter((item) => item.tempId !== tempId));
  };

  // Calculate totals
  const totals = useMemo(() => {
    let subtotalMinor = 0;
    let taxTotalMinor = 0;

    items.forEach((item) => {
      const lineTotal = item.unitPriceMinor * item.quantity;

      if (pricesIncludeTax) {
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
  }, [items, pricesIncludeTax]);

  // Submit form
  const handleSubmit = async () => {
    if (!user || !selectedDealId) return;

    // Validasyon
    if (items.length === 0) {
      toast.error('En az bir kalem ekleyin');
      return;
    }

    const invalidItems = items.filter((item) => !item.title || item.unitPriceMinor <= 0);
    if (invalidItems.length > 0) {
      toast.error('Tum kalemlerin adi ve fiyati olmali');
      return;
    }

    setSubmitting(true);
    try {
      const proposalId = await proposalService.add(
        {
          dealId: selectedDealId,
          currency,
          pricesIncludeTax,
          items: items.map((item) => ({
            catalogItemId: item.catalogItemId,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceMinor: item.unitPriceMinor,
            taxRate: item.taxRate,
          })),
        },
        user.uid
      );

      // Sistem aktivitesi ekle
      await activityService.addSystemActivity(
        'proposal_sent',
        'Yeni teklif olusturuldu',
        { dealId: selectedDealId, companyId: selectedDeal?.companyId },
        user.uid
      );

      toast.success('Teklif olusturuldu');
      router.push(`/crm/proposals/${proposalId}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Teklif olusturulamadi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/crm/proposals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Yeni Teklif</h1>
          <p className="text-muted-foreground">
            Satis firsati icin yeni teklif olusturun
          </p>
        </div>
      </div>

      {/* Deal Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Firsat Secimi</CardTitle>
          <CardDescription>
            Teklifin bagli olacagi satis firsatini secin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={dealSearchOpen} onOpenChange={setDealSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedDeal ? (
                  <span>
                    {selectedDeal.title} - {selectedDeal.companyName}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Firsat sec...</span>
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Firsat ara..." />
                <CommandList>
                  <CommandEmpty>Firsat bulunamadi</CommandEmpty>
                  <CommandGroup>
                    {deals.map((deal) => (
                      <CommandItem
                        key={deal.id}
                        value={deal.id}
                        onSelect={() => {
                          setSelectedDealId(deal.id);
                          setCurrency(deal.currency);
                          setDealSearchOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{deal.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {deal.companyName}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Teklif Ayarlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
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
                <p className="text-xs text-muted-foreground">
                  KDV dahil mi haric mi?
                </p>
              </div>
              <Switch
                checked={pricesIncludeTax}
                onCheckedChange={setPricesIncludeTax}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Teklif Kalemleri</CardTitle>
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
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center border-2 border-dashed rounded-lg">
              <Package className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Henuz kalem eklenmedi
              </p>
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
                {items.map((item) => (
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
          {items.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ara Toplam:</span>
                    <span>{formatMoney(totals.subtotalMinor, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">KDV:</span>
                    <span>{formatMoney(totals.taxTotalMinor, currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Genel Toplam:</span>
                    <span>{formatMoney(totals.grandTotalMinor, currency)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/crm/proposals">Iptal</Link>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedDealId || items.length === 0}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Teklif Olustur
        </Button>
      </div>
    </div>
  );
}
