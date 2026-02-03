'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ACTIVITY_TYPES } from '@/lib/types';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/utils/status';
import { companyService } from '@/lib/firebase/companies';
import { dealService } from '@/lib/firebase/deals';
import type { ActivityFormData, ActivityType, Company, Deal } from '@/lib/types';

// Sadece kullanici aktivite tipleri (system haric)
const USER_ACTIVITY_TYPES = ACTIVITY_TYPES.filter((t) => t !== 'system');

const formSchema = z.object({
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  type: z.enum(USER_ACTIVITY_TYPES as [string, ...string[]]),
  summary: z.string().min(1, 'Özet zorunlu'),
  details: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional().nullable(),
  occurredAt: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompanyId?: string;
  defaultDealId?: string;
  defaultWorkOrderId?: string;
  onSubmit: (data: ActivityFormData) => Promise<void>;
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  defaultCompanyId,
  defaultDealId,
  defaultWorkOrderId,
  onSubmit,
}: ActivityFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: defaultCompanyId ?? '',
      dealId: defaultDealId ?? '',
      type: 'note',
      summary: '',
      details: '',
      nextAction: '',
      nextActionDate: null,
      occurredAt: new Date(),
    },
  });

  const selectedCompanyId = form.watch('companyId');

  // Form reset when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        companyId: defaultCompanyId ?? '',
        dealId: defaultDealId ?? '',
        type: 'note',
        summary: '',
        details: '',
        nextAction: '',
        nextActionDate: null,
        occurredAt: new Date(),
      });
    }
  }, [open, defaultCompanyId, defaultDealId, form]);

  // Sirketleri yukle
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companyService.getAll({ isArchived: false });
        setCompanies(data);
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };
    if (open && !defaultCompanyId && !defaultWorkOrderId) {
      loadCompanies();
    }
  }, [open, defaultCompanyId, defaultWorkOrderId]);

  // Sirket secildiginde deal'lari yukle
  useEffect(() => {
    const loadDeals = async () => {
      if (!selectedCompanyId) {
        setDeals([]);
        return;
      }
      try {
        const data = await dealService.getAll({ companyId: selectedCompanyId });
        setDeals(data);
      } catch (error) {
        console.error('Error loading deals:', error);
      }
    };
    if (!defaultDealId) {
      loadDeals();
    }
  }, [selectedCompanyId, defaultDealId]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: ActivityFormData = {
        companyId: values.companyId || null,
        dealId: values.dealId || null,
        workOrderId: defaultWorkOrderId || null,
        type: values.type as ActivityType,
        summary: values.summary,
        details: values.details || null,
        nextAction: values.nextAction || null,
        nextActionDate: values.nextActionDate ?? null,
        occurredAt: values.occurredAt,
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Yeni Aktivite</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Sirket ve Deal secimi (eger default verilmediyse) */}
            {!defaultCompanyId && !defaultDealId && !defaultWorkOrderId && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şirket</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loadingCompanies}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Şirket seç..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
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
                  name="dealId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fırsat (Opsiyonel)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedCompanyId || deals.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Fırsat seç..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deals.map((deal) => (
                            <SelectItem key={deal.id} value={deal.id}>
                              {deal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tür</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {ACTIVITY_TYPE_CONFIG[type].label}
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
                name="occurredAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tarih</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: tr })
                              : 'Tarih seç'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Özet</FormLabel>
                  <FormControl>
                    <Input placeholder="Toplantı yapıldı, teklif konuşuldu..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detaylar (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Aktivite detayları..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Sonraki Adım (Opsiyonel)</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nextAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yapılacak</FormLabel>
                      <FormControl>
                        <Input placeholder="Teklif hazırla..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextActionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tarih</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, 'dd MMM yyyy', { locale: tr })
                                : 'Tarih seç'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                Ekle
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
