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
import { contactService } from '@/lib/firebase/contacts';
import { dealService } from '@/lib/firebase/deals';
import type { ActivityFormData, ActivityType, Company, Contact, Deal } from '@/lib/types';

const NONE_VALUE = '__none__';

// Sadece kullanici aktivite tipleri (system haric)
const USER_ACTIVITY_TYPES = ACTIVITY_TYPES.filter((t) => t !== 'system');

const formSchema = z.object({
  contactId: z.string().optional(),
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

function formatTimeValue(date: Date | null | undefined): string {
  if (!date) return '';
  return format(date, 'HH:mm');
}

function withOptionalTime(date: Date | null, timeValue: string): Date | null {
  if (!date) return null;
  if (!timeValue) return date;

  const [hours, minutes] = timeValue.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return date;

  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function formatDateWithOptionalTime(date: Date): string {
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime
    ? format(date, 'dd MMM yyyy HH:mm', { locale: tr })
    : format(date, 'dd MMM yyyy', { locale: tr });
}

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContactId?: string;
  defaultCompanyId?: string;
  defaultDealId?: string;
  defaultWorkOrderId?: string;
  onSubmit: (data: ActivityFormData) => Promise<void>;
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  defaultContactId,
  defaultCompanyId,
  defaultDealId,
  defaultWorkOrderId,
  onSubmit,
}: ActivityFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [nextActionTime, setNextActionTime] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactId: defaultContactId ?? '',
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
        contactId: defaultContactId ?? '',
        companyId: defaultCompanyId ?? '',
        dealId: defaultDealId ?? '',
        type: 'note',
        summary: '',
        details: '',
        nextAction: '',
        nextActionDate: null,
        occurredAt: new Date(),
      });
      setNextActionTime('');
    }
  }, [open, defaultContactId, defaultCompanyId, defaultDealId, form]);

  // Kisileri ve sirketleri yukle
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsData, companiesData] = await Promise.all([
          defaultContactId ? Promise.resolve([]) : contactService.getAll(),
          defaultCompanyId || defaultWorkOrderId
            ? Promise.resolve([])
            : companyService.getAll({ isArchived: false }),
        ]);
        setContacts(contactsData);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingContacts(false);
        setLoadingCompanies(false);
      }
    };
    if (open) {
      loadData();
    }
  }, [open, defaultContactId, defaultCompanyId, defaultWorkOrderId]);

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
        contactId: values.contactId || null,
        companyId: values.companyId || null,
        dealId: values.dealId || null,
        workOrderId: defaultWorkOrderId || null,
        type: values.type as ActivityType,
        summary: values.summary,
        details: values.details || null,
        nextAction: values.nextAction || null,
        nextActionDate: withOptionalTime(values.nextActionDate ?? null, nextActionTime),
        occurredAt: values.occurredAt,
      };
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
      setNextActionTime('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Baglam secicileri gosterilecek mi?
  const showContextSelectors = !defaultCompanyId && !defaultDealId && !defaultWorkOrderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Aktivite</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Kisi secimi */}
            {!defaultContactId && showContextSelectors && (
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kişi (Opsiyonel)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                      defaultValue={field.value || NONE_VALUE}
                      disabled={loadingContacts}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kişi seç..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Kişi yok</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.fullName}
                            {contact.companyName ? ` (${contact.companyName})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Sirket ve Deal secimi */}
            {showContextSelectors && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şirket (Opsiyonel)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                        defaultValue={field.value || NONE_VALUE}
                        disabled={loadingCompanies}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Şirket seç..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Şirket yok</SelectItem>
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
                        onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                        defaultValue={field.value || NONE_VALUE}
                        disabled={!selectedCompanyId || deals.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Fırsat seç..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Fırsat yok</SelectItem>
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
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'flex-1 justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value
                                  ? formatDateWithOptionalTime(field.value)
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
                        <Input
                          type="time"
                          value={nextActionTime}
                          onChange={(e) => setNextActionTime(e.target.value)}
                          className="w-[130px]"
                        />
                      </div>
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
