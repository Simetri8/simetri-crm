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
import { Goal, GoalType } from '@/lib/types';
import { goalService } from '@/lib/firebase/goals';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  title: z.string().min(2, 'Hedef başlığı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  goalType: z.enum(['task', 'contact', 'project_start', 'project_end', 'milestone']),
  status: z.enum(['planned', 'in_progress', 'completed', 'postponed']),
  targetDate: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  type: GoalType;
  defaultDate?: Date;
  weekStart?: Date;
  month?: number;
  year?: number;
  onSuccess: () => void;
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  type,
  defaultDate,
  weekStart,
  month,
  year,
  onSuccess,
}: GoalFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      goalType: 'task',
      status: 'planned',
      targetDate: defaultDate || new Date(),
    },
  });

  useEffect(() => {
    if (goal) {
      form.reset({
        title: goal.title,
        description: goal.description || '',
        goalType: goal.goalType,
        status: goal.status,
        targetDate: goal.targetDate.toDate(),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        goalType: 'task',
        status: 'planned',
        targetDate: defaultDate || new Date(),
      });
    }
  }, [goal, form, open, defaultDate]);

  const onSubmit = async (values: FormValues) => {
    try {
      const goalData = {
        title: values.title,
        description: values.description || '',
        goalType: values.goalType,
        status: values.status,
        targetDate: Timestamp.fromDate(values.targetDate),
        type,
        weekStart: weekStart ? Timestamp.fromDate(weekStart) : null,
        month: month || null,
        year: year || new Date().getFullYear(),
        relatedProjectId: null,
        relatedCustomerId: null,
      };

      if (goal?.id) {
        await goalService.update(goal.id, goalData);
        toast.success('Hedef güncellendi');
      } else {
        await goalService.add(goalData);
        toast.success('Hedef eklendi');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const getTitle = () => {
    if (goal) return 'Hedefi Düzenle';
    switch (type) {
      case 'weekly': return 'Haftalık Hedef Ekle';
      case 'monthly': return 'Aylık Hedef Ekle';
      case 'yearly': return 'Yıllık Hedef Ekle';
      default: return 'Hedef Ekle';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Hedef detaylarını aşağıdan girebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Hedef başlığı..." {...field} />
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
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detaylar..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="goalType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="task">Görev</SelectItem>
                        <SelectItem value="contact">İletişim</SelectItem>
                        <SelectItem value="project_start">Proje Başlangıç</SelectItem>
                        <SelectItem value="project_end">Proje Bitiş</SelectItem>
                        <SelectItem value="milestone">Kilometre Taşı</SelectItem>
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
                        <SelectItem value="planned">Planlandı</SelectItem>
                        <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                        <SelectItem value="completed">Tamamlandı</SelectItem>
                        <SelectItem value="postponed">Ertelendi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Hedef Tarih</FormLabel>
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
                            <span>Tarih seçin</span>
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
