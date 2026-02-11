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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { companyService } from '@/lib/firebase/companies';
import { CONTACT_STAGES, CONTACT_SOURCES } from '@/lib/types';
import { CONTACT_STAGE_CONFIG, CONTACT_SOURCE_LABELS } from '@/lib/utils/status';
import type { Contact, ContactFormData, Company } from '@/lib/types';

const NONE_VALUE = '__none__';

const formSchema = z.object({
  companyId: z.string().optional(),
  fullName: z.string().min(1, 'Ad soyad zorunlu'),
  title: z.string().optional(),
  email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  phone: z.string().optional(),
  stage: z.enum(['new', 'networking', 'warm', 'prospect', 'client', 'inactive']),
  source: z.string().optional(),
  sourceDetail: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional().nullable(),
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

type ContactFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  defaultCompanyId?: string;
  onSubmit: (data: ContactFormData) => Promise<void>;
};

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  defaultCompanyId,
  onSubmit,
}: ContactFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [nextActionTime, setNextActionTime] = useState(
    formatTimeValue(contact?.nextActionDate?.toDate() ?? null)
  );
  const isEdit = !!contact;

  const getDefaults = (): FormValues => ({
    companyId: contact?.companyId ?? defaultCompanyId ?? '',
    fullName: contact?.fullName ?? '',
    title: contact?.title ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    stage: contact?.stage ?? 'new',
    source: contact?.source ?? '',
    sourceDetail: contact?.sourceDetail ?? '',
    isPrimary: contact?.isPrimary ?? false,
    notes: contact?.notes ?? '',
    tags: contact?.tags?.join(', ') ?? '',
    nextAction: contact?.nextAction ?? '',
    nextActionDate: contact?.nextActionDate?.toDate() ?? null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaults(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaults());
      setNextActionTime(formatTimeValue(contact?.nextActionDate?.toDate() ?? null));
    }
  }, [open, contact, defaultCompanyId, form]);

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

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: ContactFormData = {
        companyId: values.companyId || null,
        fullName: values.fullName,
        title: values.title || null,
        email: values.email || null,
        phone: values.phone || null,
        stage: values.stage,
        source: (values.source as ContactFormData['source']) || null,
        sourceDetail: values.sourceDetail || null,
        isPrimary: values.isPrimary ?? false,
        notes: values.notes || null,
        tags: values.tags
          ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        nextAction: values.nextAction || null,
        nextActionDate: withOptionalTime(values.nextActionDate ?? null, nextActionTime),
      };
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
      setNextActionTime('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Kişiyi Düzenle' : 'Yeni Kişi'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ahmet Yılmaz" {...field} />
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
                        {CONTACT_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {CONTACT_STAGE_CONFIG[stage].label}
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
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kaynak</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                      defaultValue={field.value || NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seç..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Belirtilmedi</SelectItem>
                        {CONTACT_SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {CONTACT_SOURCE_LABELS[source]}
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
              name="sourceDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kaynak Detayı</FormLabel>
                  <FormControl>
                    <Input placeholder="Etkinlik adı, referans kişi vb." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şirket (opsiyonel)</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                    defaultValue={field.value || NONE_VALUE}
                    disabled={loadingCompanies || !!defaultCompanyId}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unvan</FormLabel>
                  <FormControl>
                    <Input placeholder="Genel Müdür" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ahmet@sirket.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+90 5xx xxx xxxx"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiketler</FormLabel>
                  <FormControl>
                    <Input placeholder="fintech, karar-verici, etkinlik" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sonraki Adım</FormLabel>
                  <FormControl>
                    <Input placeholder="Kahve daveti gönder..." {...field} />
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
                  <FormLabel>Sonraki Adım Tarihi</FormLabel>
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

            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Birincil Kontak</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Bu kişi şirketin ana iletişim noktasıdır
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kişi hakkında notlar..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
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
