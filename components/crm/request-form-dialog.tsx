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
import { REQUEST_TYPES, REQUEST_PRIORITIES } from '@/lib/types';
import {
  REQUEST_TYPE_LABELS,
  REQUEST_PRIORITY_CONFIG,
} from '@/lib/utils/status';
import { companyService } from '@/lib/firebase/companies';
import { contactService } from '@/lib/firebase/contacts';
import type {
  Request,
  RequestFormData,
  Company,
  Contact,
  User,
} from '@/lib/types';

const NONE_VALUE = '__none__';

const formSchema = z.object({
  title: z.string().min(1, 'Başlık zorunlu'),
  description: z.string().optional(),
  type: z.enum(REQUEST_TYPES as unknown as [string, ...string[]]),
  priority: z.enum(REQUEST_PRIORITIES as unknown as [string, ...string[]]),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type RequestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: Request | null;
  users?: User[];
  onSubmit: (data: RequestFormData) => Promise<void>;
};

export function RequestFormDialog({
  open,
  onOpenChange,
  request,
  users = [],
  onSubmit,
}: RequestFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const isEdit = !!request;

  const getDefaults = (): FormValues => ({
    title: request?.title ?? '',
    description: request?.description ?? '',
    type: request?.type ?? 'other',
    priority: request?.priority ?? 'normal',
    contactId: request?.contactId ?? '',
    companyId: request?.companyId ?? '',
    assigneeId: request?.assigneeId ?? '',
    dueDate: request?.dueDate?.toDate() ?? null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaults(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaults());
    }
  }, [open, request, form]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsData, companiesData] = await Promise.all([
          contactService.getAll(),
          companyService.getAll({ isArchived: false }),
        ]);
        setContacts(contactsData);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      loadData();
    }
  }, [open]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: RequestFormData = {
        title: values.title,
        description: values.description || null,
        type: values.type as RequestFormData['type'],
        priority: values.priority as RequestFormData['priority'],
        contactId: values.contactId || null,
        companyId: values.companyId || null,
        assigneeId: values.assigneeId || null,
        dueDate: values.dueDate ?? null,
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Talebi Düzenle' : 'Yeni Talep'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Demo ortamı kurulumu..." {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REQUEST_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {REQUEST_TYPE_LABELS[type]}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Öncelik</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REQUEST_PRIORITIES.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {REQUEST_PRIORITY_CONFIG[priority].label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Talep detayları..."
                      className="resize-none"
                      rows={3}
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
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kişi (Opsiyonel)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                      defaultValue={field.value || NONE_VALUE}
                      disabled={loading}
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
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şirket (Opsiyonel)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                      defaultValue={field.value || NONE_VALUE}
                      disabled={loading}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atanan Kişi (Opsiyonel)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NONE_VALUE ? '' : val)}
                      defaultValue={field.value || NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kişi seç..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Atanmadı</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.uid} value={u.uid}>
                            {u.displayName}
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Son Tarih</FormLabel>
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
