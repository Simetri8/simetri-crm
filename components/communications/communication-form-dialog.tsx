'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Communication, Customer } from '@/lib/types';
import { communicationService } from '@/lib/firebase/communications';
import { customerService } from '@/lib/firebase/customers';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  customerId: z.string().min(1, 'Musteri secimi zorunludur'),
  type: z.enum(['phone', 'email', 'meeting', 'other']),
  date: z.date(),
  summary: z.string().min(2, 'Ozet en az 2 karakter olmalidir'),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface CommunicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communication?: Communication | null;
  preselectedCustomerId?: string;
  onSuccess: () => void;
}

export function CommunicationFormDialog({
  open,
  onOpenChange,
  communication,
  preselectedCustomerId,
  onSuccess,
}: CommunicationFormDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: preselectedCustomerId || '',
      type: 'phone',
      date: new Date(),
      summary: '',
      nextAction: '',
      nextActionDate: null,
    },
  });

  const loadCustomers = async () => {
    try {
      console.log('CommunicationFormDialog: Loading customers...');
      const data = await customerService.getAll();
      console.log(`CommunicationFormDialog: Loaded ${data.length} customers`);
      setCustomers(data as Customer[]);
    } catch (error) {
      console.error('CommunicationFormDialog: Error loading customers:', error);
    }
  };

  useEffect(() => {
    if (!open) return;

    // Load customers and reset form in the same effect to batch updates if possible
    // or at least avoid multiple triggers
    const initializeForm = async () => {
      await loadCustomers();

      if (communication) {
        form.reset({
          customerId: communication.customerId,
          type: communication.type,
          date: communication.date.toDate(),
          summary: communication.summary,
          nextAction: communication.nextAction || '',
          nextActionDate: communication.nextActionDate?.toDate() || null,
        });
      } else {
        form.reset({
          customerId: preselectedCustomerId || '',
          type: 'phone',
          date: new Date(),
          summary: '',
          nextAction: '',
          nextActionDate: null,
        });
      }
    };

    initializeForm();
  }, [open, communication, preselectedCustomerId, form]);

  const onSubmit = async (values: FormValues) => {
    console.log('CommunicationFormDialog: Submit triggered', {
      hasCommId: !!communication?.id,
      values
    });
    try {
      const selectedCustomer = customers.find((c) => c.id === values.customerId);

      const commData = {
        customerId: values.customerId,
        customerName: selectedCustomer?.name || '',
        type: values.type,
        date: Timestamp.fromDate(values.date),
        summary: values.summary,
        nextAction: values.nextAction || null,
        nextActionDate: values.nextActionDate ? Timestamp.fromDate(values.nextActionDate) : null,
      };

      if (communication?.id) {
        await communicationService.update(communication.id, commData);
        toast.success('Gorusme guncellendi');
      } else {
        await communicationService.add(commData);
        toast.success('Gorusme eklendi');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving communication:', error);
      toast.error('Bir hata olustu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {communication ? 'Gorusmeyi Duzenle' : 'Yeni Gorusme Ekle'}
          </DialogTitle>
          <DialogDescription>
            Musteri gorusme bilgilerini asagidaki formdan girebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Musteri</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Musteri secin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <SelectItem value="none" disabled>Musteri bulunamadi</SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id || 'err'}>
                            {customer.name} - {customer.company}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                    <FormLabel>Iletisim Tipi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="phone">Telefon</SelectItem>
                        <SelectItem value="email">E-posta</SelectItem>
                        <SelectItem value="meeting">Toplanti</SelectItem>
                        <SelectItem value="other">Diger</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tarih</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'd MMM yyyy', { locale: tr })
                            ) : (
                              <span>Tarih secin</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  <FormLabel>Ozet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Gorusme hakkinda kisa ozet..."
                      className="min-h-[100px]"
                      {...field}
                    />
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
                  <FormLabel>Sonraki Adim</FormLabel>
                  <FormControl>
                    <Input placeholder="Yapilacak islem..." {...field} />
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
                  <FormLabel>Sonraki Adim Tarihi</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'd MMM yyyy', { locale: tr })
                          ) : (
                            <span>Tarih secin</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
