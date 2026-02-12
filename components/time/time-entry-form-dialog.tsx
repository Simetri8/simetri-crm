'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type {
  TimeEntry,
  TimeEntryFormData,
  WorkOrder,
  Deliverable,
  Task,
} from '@/lib/types';

const formSchema = z.object({
  workOrderId: z.string().nullable().optional(),
  deliverableId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  date: z.date({ error: 'Tarih zorunlu' }),
  hours: z.number().min(0, 'Saat 0 veya daha büyük olmalı').max(24, 'Saat 24\'ten büyük olamaz'),
  minutes: z.number().min(0, 'Dakika 0 veya daha büyük olmalı').max(59, 'Dakika 59\'dan büyük olamaz'),
  billable: z.boolean(),
  note: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type TimeEntryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntry?: TimeEntry | null;
  workOrders: WorkOrder[];
  deliverables: Deliverable[];
  tasks: Task[];
  defaultWorkOrderId?: string | null;
  defaultDate?: Date;
  onSubmit: (data: TimeEntryFormData) => Promise<void>;
};

export function TimeEntryFormDialog({
  open,
  onOpenChange,
  timeEntry,
  workOrders,
  deliverables,
  tasks,
  defaultWorkOrderId,
  defaultDate,
  onSubmit,
}: TimeEntryFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workOrderSearchOpen, setWorkOrderSearchOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const isEdit = !!timeEntry;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workOrderId: timeEntry?.workOrderId ?? defaultWorkOrderId ?? null,
      deliverableId: timeEntry?.deliverableId ?? null,
      taskId: timeEntry?.taskId ?? null,
      date: timeEntry?.date?.toDate() ?? defaultDate ?? new Date(),
      hours: timeEntry ? Math.floor(timeEntry.durationMinutes / 60) : 0,
      minutes: timeEntry ? timeEntry.durationMinutes % 60 : 0,
      billable: timeEntry?.billable ?? true,
      note: timeEntry?.note ?? null,
    },
  });

  const selectedWorkOrderId = form.watch('workOrderId');
  const selectedDeliverableId = form.watch('deliverableId');

  // Filter deliverables by selected work order
  const filteredDeliverables = deliverables.filter(
    (d) => d.workOrderId === selectedWorkOrderId
  );

  // Filter tasks by selected work order and optionally deliverable
  const filteredTasks = tasks.filter((t) => {
    if (selectedDeliverableId) {
      return t.deliverableId === selectedDeliverableId;
    }
    return t.workOrderId === selectedWorkOrderId;
  });

  // Reset form when dialog opens/closes or timeEntry changes
  useEffect(() => {
    if (open) {
      form.reset({
        workOrderId: timeEntry?.workOrderId ?? defaultWorkOrderId ?? null,
        deliverableId: timeEntry?.deliverableId ?? null,
        taskId: timeEntry?.taskId ?? null,
        date: timeEntry?.date?.toDate() ?? defaultDate ?? new Date(),
        hours: timeEntry ? Math.floor(timeEntry.durationMinutes / 60) : 0,
        minutes: timeEntry ? timeEntry.durationMinutes % 60 : 0,
        billable: timeEntry?.billable ?? true,
        note: timeEntry?.note ?? null,
      });
    }
  }, [open, timeEntry, defaultWorkOrderId, defaultDate, form]);

  // Reset deliverable and task when work order changes
  useEffect(() => {
    if (!selectedWorkOrderId) {
      form.setValue('deliverableId', null);
      form.setValue('taskId', null);
    }
  }, [selectedWorkOrderId, form]);

  // Reset task when deliverable changes
  useEffect(() => {
    if (!selectedDeliverableId && form.getValues('taskId')) {
      const task = tasks.find((t) => t.id === form.getValues('taskId'));
      if (task?.deliverableId) {
        form.setValue('taskId', null);
      }
    }
  }, [selectedDeliverableId, form, tasks]);

  const selectedWorkOrder = workOrders.find((wo) => wo.id === selectedWorkOrderId);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const durationMinutes = values.hours * 60 + values.minutes;
      if (durationMinutes === 0) {
        form.setError('hours', { message: 'Süre 0 olamaz' });
        return;
      }

      const data: TimeEntryFormData = {
        workOrderId: values.workOrderId || null,
        deliverableId: values.deliverableId || null,
        taskId: values.taskId || null,
        date: values.date,
        durationMinutes,
        billable: values.billable,
        note: values.note || null,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Zaman Girişini Düzenle' : 'Yeni Zaman Girişi'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-1">
            {/* Work Order Selection */}
            <FormField
              control={form.control}
              name="workOrderId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>İş Emri (Opsiyonel)</FormLabel>
                  <Popover open={workOrderSearchOpen} onOpenChange={setWorkOrderSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {selectedWorkOrder?.title || 'İş emri seç...'}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="İş emri ara..." />
                        <CommandList>
                          <CommandEmpty>İş emri bulunamadı</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => {
                                field.onChange(null);
                                setWorkOrderSearchOpen(false);
                              }}
                            >
                              <span className="text-muted-foreground">İş emri seçme</span>
                            </CommandItem>
                            {workOrders.map((wo) => (
                              <CommandItem
                                key={wo.id}
                                value={wo.id}
                                onSelect={() => {
                                  field.onChange(wo.id);
                                  setWorkOrderSearchOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span>{wo.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {wo.companyName}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deliverable Selection */}
            {selectedWorkOrderId && filteredDeliverables.length > 0 && (
              <FormField
                control={form.control}
                name="deliverableId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teslimat (Opsiyonel)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                      value={field.value ?? 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Teslimat seç" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Teslimat seçme</SelectItem>
                        {filteredDeliverables.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Task Selection */}
            {selectedWorkOrderId && filteredTasks.length > 0 && (
              <FormField
                control={form.control}
                name="taskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Görev (Opsiyonel)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                      value={field.value ?? 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Görev seç" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Görev seçme</SelectItem>
                        {filteredTasks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tarih</FormLabel>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? format(field.value, 'dd MMM yyyy, EEEE', { locale: tr })
                            : 'Tarih seç'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date ?? new Date());
                          setDatePopoverOpen(false);
                        }}
                        locale={tr}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saat</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dakika</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        step={15}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Billable */}
            <FormField
              control={form.control}
              name="billable"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Faturalanabilir</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Bu süre müşteriye faturalanabilir mi?
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Not (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Yapılan işler hakkında kısa not..."
                      className="resize-none"
                      rows={2}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            </div>
            <DialogFooter sticky className="mt-4">
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
