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
import { DEAL_STAGES, CURRENCIES } from '@/lib/types';
import { DEAL_STAGE_CONFIG, CURRENCY_CONFIG } from '@/lib/utils/status';
import { companyService } from '@/lib/firebase/companies';
import { contactService } from '@/lib/firebase/contacts';
import type { Deal, DealFormData, Company, Contact, DealStage } from '@/lib/types';

const formSchema = z.object({
  companyId: z.string().min(1, 'Şirket seçimi zorunlu'),
  primaryContactId: z.string().min(1, 'Kontak seçimi zorunlu'),
  title: z.string().min(1, 'Başlık zorunlu'),
  stage: z.enum(DEAL_STAGES),
  expectedCloseDate: z.date().optional().nullable(),
  estimatedBudgetMinor: z.number().optional().nullable(),
  currency: z.enum(CURRENCIES),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type DealFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  defaultStage?: DealStage;
  onSubmit: (data: DealFormData) => Promise<void>;
};

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  defaultStage,
  onSubmit,
}: DealFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const isEdit = !!deal;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: deal?.companyId ?? '',
      primaryContactId: deal?.primaryContactId ?? '',
      title: deal?.title ?? '',
      stage: deal?.stage ?? defaultStage ?? 'lead',
      expectedCloseDate: deal?.expectedCloseDate?.toDate() ?? null,
      estimatedBudgetMinor: deal?.estimatedBudgetMinor
        ? deal.estimatedBudgetMinor / 100
        : null,
      currency: deal?.currency ?? 'TRY',
      nextAction: deal?.nextAction ?? '',
      nextActionDate: deal?.nextActionDate?.toDate() ?? null,
    },
  });

  const selectedCompanyId = form.watch('companyId');

  // Form reset when deal changes
  useEffect(() => {
    if (open) {
      form.reset({
        companyId: deal?.companyId ?? '',
        primaryContactId: deal?.primaryContactId ?? '',
        title: deal?.title ?? '',
        stage: deal?.stage ?? defaultStage ?? 'lead',
        expectedCloseDate: deal?.expectedCloseDate?.toDate() ?? null,
        estimatedBudgetMinor: deal?.estimatedBudgetMinor
          ? deal.estimatedBudgetMinor / 100
          : null,
        currency: deal?.currency ?? 'TRY',
        nextAction: deal?.nextAction ?? '',
        nextActionDate: deal?.nextActionDate?.toDate() ?? null,
      });
    }
  }, [open, deal, defaultStage, form]);

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
    if (open) {
      loadCompanies();
    }
  }, [open]);

  // Sirket secildiginde kontaklari yukle
  useEffect(() => {
    const loadContacts = async () => {
      if (!selectedCompanyId) {
        setContacts([]);
        return;
      }
      try {
        const data = await contactService.getByCompanyId(selectedCompanyId);
        setContacts(data);
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };
    loadContacts();
  }, [selectedCompanyId]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: DealFormData = {
        companyId: values.companyId,
        primaryContactId: values.primaryContactId,
        title: values.title,
        stage: values.stage,
        expectedCloseDate: values.expectedCloseDate ?? null,
        estimatedBudgetMinor: values.estimatedBudgetMinor
          ? Math.round(values.estimatedBudgetMinor * 100)
          : null,
        currency: values.currency,
        nextAction: values.nextAction || null,
        nextActionDate: values.nextActionDate ?? null,
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
          <DialogTitle>
            {isEdit ? 'Fırsatı Düzenle' : 'Yeni Fırsat'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                name="primaryContactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kontak</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedCompanyId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kontak seç..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Mobil Uygulama Projesi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aşama</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_STAGES.filter(
                          (stage) => stage !== 'won' && stage !== 'lost'
                        ).map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {DEAL_STAGE_CONFIG[stage].label}
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
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Beklenen Kapanma</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedBudgetMinor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahmini Bütçe</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? null : parseFloat(val));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {CURRENCY_CONFIG[currency].symbol} {CURRENCY_CONFIG[currency].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nextAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sonraki Adım</FormLabel>
                  <FormControl>
                    <Input placeholder="Teklif hazırla..." {...field} />
                  </FormControl>
                  <FormMessage />
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
