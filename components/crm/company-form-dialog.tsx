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
import { COMPANY_STATUS, COMPANY_SOURCES } from '@/lib/types';
import { COMPANY_STATUS_CONFIG, COMPANY_SOURCE_LABELS } from '@/lib/utils/status';
import type { Company, CompanyFormData } from '@/lib/types';

const NONE_VALUE = '__none__';

const formSchema = z.object({
  name: z.string().min(1, 'Şirket adı zorunlu'),
  status: z.enum(['prospect', 'active', 'inactive', 'churned']),
  source: z.string().optional(),
  sourceDetail: z.string().optional(),
  tags: z.string(),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional().nullable(),
  logoUrl: z
    .string()
    .url('Geçerli bir URL girin')
    .or(z.literal(''))
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CompanyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSubmit: (data: CompanyFormData) => Promise<void>;
};

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
}: CompanyFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!company;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company?.name ?? '',
      status: company?.status ?? 'prospect',
      source: company?.source ?? '',
      sourceDetail: company?.sourceDetail ?? '',
      tags: company?.tags?.join(', ') ?? '',
      nextAction: company?.nextAction ?? '',
      nextActionDate: company?.nextActionDate?.toDate() ?? null,
      logoUrl: company?.logoUrl ?? '',
    },
  });

  // Form reset when company changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: company?.name ?? '',
        status: company?.status ?? 'prospect',
        source: company?.source ?? '',
        sourceDetail: company?.sourceDetail ?? '',
        tags: company?.tags?.join(', ') ?? '',
        nextAction: company?.nextAction ?? '',
        nextActionDate: company?.nextActionDate?.toDate() ?? null,
        logoUrl: company?.logoUrl ?? '',
      });
    }
  }, [open, company, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: CompanyFormData = {
        name: values.name,
        status: values.status,
        source: (values.source as CompanyFormData['source']) || null,
        sourceDetail: values.sourceDetail || null,
        tags: values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        nextAction: values.nextAction || null,
        nextActionDate: values.nextActionDate ?? null,
        logoUrl: values.logoUrl ? values.logoUrl : null,
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
            {isEdit ? 'Şirketi Düzenle' : 'Yeni Şirket'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şirket Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Teknoloji" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://.../logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPANY_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {COMPANY_STATUS_CONFIG[status].label}
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
                        {COMPANY_SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {COMPANY_SOURCE_LABELS[source]}
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
                    <Input placeholder="Referans kişi, etkinlik adı vb." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiketler</FormLabel>
                  <FormControl>
                    <Input placeholder="yazılım, fintech, startup" {...field} />
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
                    <Input placeholder="Teklif gönder..." {...field} />
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
