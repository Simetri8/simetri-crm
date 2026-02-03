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
import { cn } from '@/lib/utils';
import { TASK_STATUSES, BLOCKED_REASONS } from '@/lib/types';
import { TASK_STATUS_CONFIG, BLOCKED_REASON_LABELS } from '@/lib/utils/status';
import type { Task, TaskFormData, Deliverable, User } from '@/lib/types';

const formSchema = z.object({
  title: z.string().min(1, 'Baslik zorunlu'),
  status: z.enum(TASK_STATUSES),
  blockedReason: z.enum(BLOCKED_REASONS).nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  deliverableId: z.string().nullable().optional(),
  dueDate: z.date().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  deliverableId?: string | null;
  task?: Task | null;
  deliverables?: Deliverable[];
  users?: User[];
  onSubmit: (data: TaskFormData) => Promise<void>;
};

export function TaskFormDialog({
  open,
  onOpenChange,
  workOrderId,
  deliverableId,
  task,
  deliverables = [],
  users = [],
  onSubmit,
}: TaskFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigneeSearchOpen, setAssigneeSearchOpen] = useState(false);
  const isEdit = !!task;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title ?? '',
      status: task?.status ?? 'backlog',
      blockedReason: task?.blockedReason ?? null,
      assigneeId: task?.assigneeId ?? null,
      deliverableId: task?.deliverableId ?? deliverableId ?? null,
      dueDate: task?.dueDate?.toDate() ?? null,
    },
  });

  const watchStatus = form.watch('status');
  const selectedAssignee = users.find((u) => u.uid === form.watch('assigneeId'));

  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title ?? '',
        status: task?.status ?? 'backlog',
        blockedReason: task?.blockedReason ?? null,
        assigneeId: task?.assigneeId ?? null,
        deliverableId: task?.deliverableId ?? deliverableId ?? null,
        dueDate: task?.dueDate?.toDate() ?? null,
      });
    }
  }, [open, task, deliverableId, form]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data: TaskFormData = {
        workOrderId,
        title: values.title,
        status: values.status,
        blockedReason: values.status === 'blocked' ? values.blockedReason : null,
        assigneeId: values.assigneeId || null,
        deliverableId: values.deliverableId || null,
        dueDate: values.dueDate || null,
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
            {isEdit ? 'Gorevi Duzenle' : 'Yeni Gorev'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baslik</FormLabel>
                  <FormControl>
                    <Input placeholder="Gorev basligi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deliverable Selection */}
            {deliverables.length > 0 && (
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
                          <SelectValue placeholder="Teslimat sec" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Teslimat secme</SelectItem>
                        {deliverables.map((d) => (
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

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
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
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {TASK_STATUS_CONFIG[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
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
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: tr })
                              : 'Tarih sec'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          locale={tr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Blocked Reason - only show when status is blocked */}
            {watchStatus === 'blocked' && (
              <FormField
                control={form.control}
                name="blockedReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engel Nedeni</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Neden sec" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BLOCKED_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {BLOCKED_REASON_LABELS[reason]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Assignee Selection */}
            {users.length > 0 && (
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Atanan Kisi</FormLabel>
                    <Popover open={assigneeSearchOpen} onOpenChange={setAssigneeSearchOpen}>
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
                            {selectedAssignee?.displayName || 'Kisi sec (opsiyonel)'}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Kisi ara..." />
                          <CommandList>
                            <CommandEmpty>Kisi bulunamadi</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  field.onChange(null);
                                  setAssigneeSearchOpen(false);
                                }}
                              >
                                <span className="text-muted-foreground">Atama yapma</span>
                              </CommandItem>
                              {users.map((user) => (
                                <CommandItem
                                  key={user.uid}
                                  value={user.uid}
                                  onSelect={() => {
                                    field.onChange(user.uid);
                                    setAssigneeSearchOpen(false);
                                  }}
                                >
                                  {user.displayName || user.email}
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
            )}

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
                {isEdit ? 'Guncelle' : 'Olustur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
