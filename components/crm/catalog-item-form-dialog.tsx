'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CATALOG_ITEM_TYPES, UNITS, CURRENCIES } from '@/lib/types';
import {
  CATALOG_ITEM_TYPE_LABELS,
  UNIT_LABELS,
  CURRENCY_CONFIG,
} from '@/lib/utils/status';
import type { CatalogItem, CatalogItemFormData } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'Kalem adı zorunlu'),
  type: z.enum(CATALOG_ITEM_TYPES),
  unit: z.enum(UNITS),
  defaultUnitPriceMinor: z.number().min(0, 'Fiyat 0 veya daha büyük olmalı'),
  currency: z.enum(CURRENCIES),
  taxRate: z.number().min(0).max(100),
  isActive: z.boolean(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CatalogItemFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: CatalogItem | null;
  onSubmit: (data: CatalogItemFormData) => Promise<void>;
};

export function CatalogItemFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
}: CatalogItemFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!item;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name ?? '',
      type: item?.type ?? 'service',
      unit: item?.unit ?? 'hour',
      defaultUnitPriceMinor: item?.defaultUnitPriceMinor
        ? item.defaultUnitPriceMinor / 100
        : 0,
      currency: item?.currency ?? 'TRY',
      taxRate: item?.taxRate ?? 20,
      isActive: item?.isActive ?? true,
      description: item?.description ?? '',
    },
  });

  // Form reset when item changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: item?.name ?? '',
        type: item?.type ?? 'service',
        unit: item?.unit ?? 'hour',
        defaultUnitPriceMinor: item?.defaultUnitPriceMinor
          ? item.defaultUnitPriceMinor / 100
          : 0,
        currency: item?.currency ?? 'TRY',
        taxRate: item?.taxRate ?? 20,
        isActive: item?.isActive ?? true,
        description: item?.description ?? '',
      });
    }
  }, [open, item, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: CatalogItemFormData = {
        name: values.name,
        type: values.type,
        unit: values.unit,
        defaultUnitPriceMinor: Math.round(values.defaultUnitPriceMinor * 100),
        currency: values.currency,
        taxRate: values.taxRate,
        isActive: values.isActive,
        description: values.description || null,
      };
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Kalemi Düzenle' : 'Yeni Katalog Kalemi'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kalem Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Web Geliştirme Hizmeti" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tür</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATALOG_ITEM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {CATALOG_ITEM_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birim</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {UNIT_LABELS[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="defaultUnitPriceMinor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birim Fiyat</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1000"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para Birimi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {CURRENCY_CONFIG[currency].symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KDV %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="20"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kalem hakkında detaylar..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Aktif</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Pasif kalemler tekliflerde görünmez
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
