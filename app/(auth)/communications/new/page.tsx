'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import Link from 'next/link';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer, Project } from '@/lib/types';
import { communicationService } from '@/lib/firebase/communications';
import { customerService } from '@/lib/firebase/customers';
import { projectService } from '@/lib/firebase/projects';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  customerId: z.string().min(1, 'Musteri secimi zorunludur'),
  projectId: z.string().optional(),
  type: z.enum(['phone', 'email', 'meeting', 'other']),
  date: z.date(),
  summary: z.string().min(2, 'Ozet en az 2 karakter olmalidir'),
  nextAction: z.string().optional(),
  nextActionDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCommunicationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      projectId: '',
      type: 'phone',
      date: new Date(),
      summary: '',
      nextAction: '',
      nextActionDate: null,
    },
  });

  const selectedCustomerId = form.watch('customerId');

  // Filter projects by selected customer
  const filteredProjects = selectedCustomerId
    ? projects.filter((p) => p.customerId === selectedCustomerId || !p.customerId)
    : projects;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, projectsData] = await Promise.all([
          customerService.getAll(),
          projectService.getAll(),
        ]);
        setCustomers(customersData as Customer[]);
        setProjects(projectsData as Project[]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const selectedCustomer = customers.find((c) => c.id === values.customerId);
      const selectedProject = values.projectId ? projects.find((p) => p.id === values.projectId) : null;

      const commData = {
        customerId: values.customerId,
        customerName: selectedCustomer?.company || '',
        projectId: values.projectId || null,
        projectName: selectedProject?.name || null,
        type: values.type,
        date: Timestamp.fromDate(values.date),
        summary: values.summary,
        nextAction: values.nextAction || null,
        nextActionDate: values.nextActionDate ? Timestamp.fromDate(values.nextActionDate) : null,
      };

      await communicationService.add(commData);
      toast.success(values.nextAction && values.nextActionDate
        ? 'Gorusme eklendi ve gorev olusturuldu'
        : 'Gorusme eklendi');
      router.push('/communications');
    } catch (error) {
      console.error('Error saving communication:', error);
      toast.error('Bir hata olustu');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/communications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Yeni Gorusme</h2>
          <p className="text-muted-foreground">Yeni bir gorusme kaydi ekleyin.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gorusme Bilgileri</CardTitle>
          <CardDescription>
            Musteri gorusme bilgilerini asagidaki formdan girebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proje (Opsiyonel)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Proje secin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Proje yok</SelectItem>
                          {filteredProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id || 'err'}>
                              {project.name}
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

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/communications">Iptal</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
