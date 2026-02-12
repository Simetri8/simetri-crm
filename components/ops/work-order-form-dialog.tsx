'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { WORK_ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/types';
import { WORK_ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/utils/status';
import type {
  WorkOrder,
  WorkOrderFormData,
  Company,
  Deal,
} from '@/lib/types';

const formSchema = z.object({
  companyId: z.string().min(1, 'Şirket seçimi zorunlu'),
  dealId: z.string().nullable().optional(),
  title: z.string().min(1, 'Başlık zorunlu'),
  status: z.enum(WORK_ORDER_STATUSES),
  startDate: z.date().nullable().optional(),
  targetDeliveryDate: z.date({ error: 'Hedef teslim tarihi zorunlu' }),
  scopeSummary: z.string().nullable().optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

type FormValues = z.infer<typeof formSchema>;

type WorkOrderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder?: WorkOrder | null;
  companies: Company[];
  deals: Deal[];
  onSubmit: (data: WorkOrderFormData) => Promise<void>;
};

export function WorkOrderFormDialog({
  open,
  onOpenChange,
  workOrder,
  companies,
  deals,
  onSubmit,
}: WorkOrderFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [dealSearchOpen, setDealSearchOpen] = useState(false);
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [targetDeliveryDatePopoverOpen, setTargetDeliveryDatePopoverOpen] = useState(false);
  const isEdit = !!workOrder;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: workOrder?.companyId ?? '',
      dealId: workOrder?.dealId ?? null,
      title: workOrder?.title ?? '',
      status: workOrder?.status ?? 'active',
      startDate: workOrder?.startDate?.toDate() ?? null,
      targetDeliveryDate: workOrder?.targetDeliveryDate?.toDate() ?? new Date(),
      scopeSummary: workOrder?.scopeSummary ?? null,
      paymentStatus: workOrder?.paymentStatus ?? 'unplanned',
    },
  });

  const selectedCompanyId = form.watch('companyId');

  // Filter deals by selected company
  const filteredDeals = deals.filter((d) => d.companyId === selectedCompanyId);

  // Reset form when dialog opens/closes or workOrder changes
  useEffect(() => {
    if (open) {
      form.reset({
        companyId: workOrder?.companyId ?? '',
        dealId: workOrder?.dealId ?? null,
        title: workOrder?.title ?? '',
        status: workOrder?.status ?? 'active',
        startDate: workOrder?.startDate?.toDate() ?? null,
        targetDeliveryDate: workOrder?.targetDeliveryDate?.toDate() ?? new Date(),
        scopeSummary: workOrder?.scopeSummary ?? null,
        paymentStatus: workOrder?.paymentStatus ?? 'unplanned',
      });
    }
  }, [open, workOrder, form]);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const selectedDeal = deals.find((d) => d.id === form.watch('dealId'));

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: WorkOrderFormData = {
        companyId: values.companyId,
        dealId: values.dealId || null,
        title: values.title,
        status: values.status,
        startDate: values.startDate || null,
        targetDeliveryDate: values.targetDeliveryDate,
        scopeSummary: values.scopeSummary || null,
        paymentStatus: values.paymentStatus,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'İş Emrini Düzenle' : 'Yeni İş Emri'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-1">
            {/* Company Selection */}
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Şirket</FormLabel>
                  <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {selectedCompany?.name || 'Şirket seç...'}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Şirket ara..." />
                        <CommandList>
                          <CommandEmpty>Şirket bulunamadı</CommandEmpty>
                          <CommandGroup>
                            {companies.map((company) => (
                              <CommandItem
                                key={company.id}
                                value={company.id}
                                onSelect={() => {
                                  field.onChange(company.id);
                                  form.setValue('dealId', null);
                                  setCompanySearchOpen(false);
                                }}
                              >
                                {company.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deal Selection (Optional) */}
            {selectedCompanyId && filteredDeals.length > 0 && (
              <FormField
                control={form.control}
                name="dealId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fırsat (Opsiyonel)</FormLabel>
                    <Popover open={dealSearchOpen} onOpenChange={setDealSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {selectedDeal?.title || 'Fırsat seç (opsiyonel)...'}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Fırsat ara..." />
                          <CommandList>
                            <CommandEmpty>Fırsat bulunamadı</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  field.onChange(null);
                                  setDealSearchOpen(false);
                                }}
                              >
                                <span className="text-muted-foreground">Fırsat seçme</span>
                              </CommandItem>
                              {filteredDeals.map((deal) => (
                                <CommandItem
                                  key={deal.id}
                                  value={deal.id}
                                  onSelect={() => {
                                    field.onChange(deal.id);
                                    if (!form.getValues('title')) {
                                      form.setValue('title', deal.title);
                                    }
                                    setDealSearchOpen(false);
                                  }}
                                >
                                  {deal.title}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="İş emri başlığı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORK_ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {WORK_ORDER_STATUS_CONFIG[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Status */}
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ödeme Durumu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {PAYMENT_STATUS_CONFIG[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Başlangıç Tarihi</FormLabel>
                    <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: tr })
                              : 'Tarih seç'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={(date) => {
                            field.onChange(date);
                            setStartDatePopoverOpen(false);
                          }}
                          locale={tr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Delivery Date */}
              <FormField
                control={form.control}
                name="targetDeliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hedef Teslim Tarihi</FormLabel>
                    <Popover
                      open={targetDeliveryDatePopoverOpen}
                      onOpenChange={setTargetDeliveryDatePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: tr })
                              : 'Tarih seç'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date ?? new Date());
                            setTargetDeliveryDatePopoverOpen(false);
                          }}
                          locale={tr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Scope Summary */}
            <FormField
              control={form.control}
              name="scopeSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapsam Özeti (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="İş kapsamının kısa özeti..."
                      className="resize-none"
                      rows={3}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            </div>
            <DialogFooter sticky className="mt-4">
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
