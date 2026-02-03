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
import { Checkbox } from '@/components/ui/checkbox';
import { companyService } from '@/lib/firebase/companies';
import type { Contact, ContactFormData, Company } from '@/lib/types';

const formSchema = z.object({
  companyId: z.string().min(1, 'Şirket seçimi zorunlu'),
  fullName: z.string().min(1, 'Ad soyad zorunlu'),
  title: z.string().optional(),
  email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const isEdit = !!contact;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: contact?.companyId ?? defaultCompanyId ?? '',
      fullName: contact?.fullName ?? '',
      title: contact?.title ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      isPrimary: contact?.isPrimary ?? false,
      notes: contact?.notes ?? '',
    },
  });

  // Form reset when contact changes
  useEffect(() => {
    if (open) {
      form.reset({
        companyId: contact?.companyId ?? defaultCompanyId ?? '',
        fullName: contact?.fullName ?? '',
        title: contact?.title ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        isPrimary: contact?.isPrimary ?? false,
        notes: contact?.notes ?? '',
      });
    }
  }, [open, contact, defaultCompanyId, form]);

  // Şirketleri yükle
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
        companyId: values.companyId,
        fullName: values.fullName,
        title: values.title || null,
        email: values.email || null,
        phone: values.phone || null,
        isPrimary: values.isPrimary ?? false,
        notes: values.notes || null,
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
            {isEdit ? 'Kişiyi Düzenle' : 'Yeni Kişi'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şirket</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingCompanies || !!defaultCompanyId}
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
                        placeholder="ahmet@şirket.com"
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
