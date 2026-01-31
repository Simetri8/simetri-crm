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
import { Project, Customer } from '@/lib/types';
import { projectService } from '@/lib/firebase/projects';
import { customerService } from '@/lib/firebase/customers';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, 'Proje adi en az 2 karakter olmalidir'),
  description: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(['active', 'pending', 'completed']),
  targetStartDate: z.date().optional().nullable(),
  targetEndDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSuccess: () => void;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectFormDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      customerId: '',
      status: 'active',
      targetStartDate: null,
      targetEndDate: null,
    },
  });

  const loadCustomers = async () => {
    try {
      console.log('ProjectFormDialog: Loading customers...');
      const data = await customerService.getAll();
      console.log(`ProjectFormDialog: Loaded ${data.length} customers`);
      setCustomers(data as Customer[]);
    } catch (error) {
      console.error('ProjectFormDialog: Error loading customers:', error);
    }
  };

  useEffect(() => {
    if (!open) return;

    const initializeForm = async () => {
      await loadCustomers();

      if (project) {
        form.reset({
          name: project.name,
          description: project.description || '',
          customerId: project.customerId || '',
          status: project.status,
          targetStartDate: project.targetStartDate?.toDate() || null,
          targetEndDate: project.targetEndDate?.toDate() || null,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          customerId: '',
          status: 'active',
          targetStartDate: null,
          targetEndDate: null,
        });
      }
    };

    initializeForm();
  }, [open, project, form]);

  const onSubmit = async (values: FormValues) => {
    console.log('ProjectFormDialog: Submit triggered', {
      hasProjectId: !!project?.id,
      values
    });
    try {
      const selectedCustomer = customers.find((c) => c.id === values.customerId);

      const projectData = {
        name: values.name,
        description: values.description || '',
        customerId: values.customerId || null,
        customerName: selectedCustomer?.name || null,
        status: values.status,
        targetStartDate: values.targetStartDate ? Timestamp.fromDate(values.targetStartDate) : null,
        targetEndDate: values.targetEndDate ? Timestamp.fromDate(values.targetEndDate) : null,
      };

      if (project?.id) {
        await projectService.update(project.id, projectData);
        toast.success('Proje guncellendi');
      } else {
        await projectService.add(projectData);
        toast.success('Proje eklendi');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Bir hata olustu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Projeyi Duzenle' : 'Yeni Proje Ekle'}
          </DialogTitle>
          <DialogDescription>
            Proje bilgilerini asagidaki formdan girebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proje Adi</FormLabel>
                  <FormControl>
                    <Input placeholder="Web Sitesi Yenileme" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aciklama</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Proje hakkinda kisa aciklama..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Musteri</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Musteri secin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Musteri yok</SelectItem>
                        {customers.length === 0 ? (
                          <SelectItem value="none-disabled" disabled>Musteri bulunamadi</SelectItem>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id || 'none'}>
                              {customer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="pending">Beklemede</SelectItem>
                        <SelectItem value="completed">Tamamlandi</SelectItem>
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
                name="targetStartDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Baslangic Tarihi</FormLabel>
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

              <FormField
                control={form.control}
                name="targetEndDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Bitis Tarihi</FormLabel>
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
            </div>

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
