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
import { Task } from '@/lib/types';
import { taskService } from '@/lib/firebase/tasks';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  title: z.string().min(2, 'Gorev adi en az 2 karakter olmalidir'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  dueDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projectId?: string | null;
  projectName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  onSuccess: () => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projectId,
  projectName,
  customerId,
  customerName,
  onSuccess,
}: TaskFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'normal',
      dueDate: null,
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toDate() || null,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'normal',
        dueDate: null,
      });
    }
  }, [task, form, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (task?.id) {
        await taskService.update(task.id, {
          title: values.title,
          description: values.description || '',
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate ? Timestamp.fromDate(values.dueDate) : null,
        });
        toast.success('Gorev guncellendi');
      } else {
        const maxOrder = projectId ? await taskService.getMaxOrder(projectId) : 0;
        await taskService.add({
          projectId: projectId || null,
          projectName: projectName || null,
          customerId: customerId || null,
          customerName: customerName || null,
          sourceCommunicationId: null,
          title: values.title,
          description: values.description || '',
          status: values.status,
          priority: values.priority,
          order: maxOrder + 1,
          dueDate: values.dueDate ? Timestamp.fromDate(values.dueDate) : null,
          weeklyPlanDate: null,
        });
        toast.success('Gorev eklendi');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Bir hata olustu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Gorevi Duzenle' : 'Yeni Gorev Ekle'}
          </DialogTitle>
          <DialogDescription>
            Gorev bilgilerini asagidaki formdan girebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gorev Adi</FormLabel>
                  <FormControl>
                    <Input placeholder="Tasarim revizyonu" {...field} />
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
                    <Textarea placeholder="Gorev detaylari..." {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">Yapilacak</SelectItem>
                        <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                        <SelectItem value="done">Tamamlandi</SelectItem>
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
                    <FormLabel>Oncelik</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Dusuk</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Yuksek</SelectItem>
                        <SelectItem value="urgent">Acil</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
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
