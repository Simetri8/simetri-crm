'use client';

import { useState, useEffect, useMemo } from 'react';
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WeeklySummary } from '@/components/time/weekly-summary';
import { TimeEntryList } from '@/components/time/time-entry-list';
import { TimeEntryFormDialog } from '@/components/time/time-entry-form-dialog';
import { timeEntryService } from '@/lib/firebase/time-entries';
import { workOrderService } from '@/lib/firebase/work-orders';
import { deliverableService } from '@/lib/firebase/deliverables';
import { taskService } from '@/lib/firebase/tasks';
import { useAuth } from '@/components/auth/auth-provider';
import { getWeekKey, formatDuration } from '@/lib/utils/status';
import type {
  TimeEntry,
  TimeEntryFormData,
  WorkOrder,
  Deliverable,
  Task,
} from '@/lib/types';

export default function TimePage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [submitWeekOpen, setSubmitWeekOpen] = useState(false);

  const weekKey = useMemo(() => getWeekKey(weekStart), [weekStart]);

  const loadEntries = async () => {
    if (!user) return;
    try {
      const data = await timeEntryService.getByUserAndWeek(user.uid, weekKey);
      setEntries(data);
    } catch (error) {
      console.error('Error loading time entries:', error);
      toast.error('Zaman girisleri yuklenemedi');
    }
  };

  const loadSupportData = async () => {
    try {
      const [workOrdersData, deliverablesData, tasksData] = await Promise.all([
        workOrderService.getActive(),
        deliverableService.getAll(),
        taskService.getAll({ statuses: ['backlog', 'in-progress'] }),
      ]);
      setWorkOrders(workOrdersData);
      setDeliverables(deliverablesData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading support data:', error);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadEntries(), loadSupportData()]);
      setLoading(false);
    };
    loadAll();
  }, [user, weekKey]);

  const handleCreate = async (data: TimeEntryFormData) => {
    if (!user) return;
    try {
      await timeEntryService.add(data, user.uid);
      toast.success('Zaman girisi eklendi');
      loadEntries();
    } catch (error) {
      console.error('Error creating time entry:', error);
      toast.error('Zaman girisi eklenemedi');
    }
  };

  const handleUpdate = async (data: TimeEntryFormData) => {
    if (!user || !editingEntry) return;
    try {
      await timeEntryService.update(editingEntry.id, data, user.uid);
      toast.success('Zaman girisi guncellendi');
      setEditingEntry(null);
      loadEntries();
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast.error('Zaman girisi guncellenemedi');
    }
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    try {
      await timeEntryService.delete(deleteEntry.id);
      toast.success('Zaman girisi silindi');
      setDeleteEntry(null);
      loadEntries();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast.error('Zaman girisi silinemedi');
    }
  };

  const handleSubmitWeek = async () => {
    if (!user) return;
    try {
      await timeEntryService.submitWeek(user.uid, weekKey, user.uid);
      toast.success('Haftalik girisler gonderildi');
      setSubmitWeekOpen(false);
      loadEntries();
    } catch (error) {
      console.error('Error submitting week:', error);
      toast.error('Haftalik girisler gonderilemedi');
    }
  };

  const handleAddEntry = (date: Date) => {
    setDefaultDate(date);
    setFormOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  // Filter entries by selected date
  const filteredEntries = selectedDate
    ? entries.filter((e) => {
        const entryDate = e.date.toDate();
        return (
          entryDate.getFullYear() === selectedDate.getFullYear() &&
          entryDate.getMonth() === selectedDate.getMonth() &&
          entryDate.getDate() === selectedDate.getDate()
        );
      })
    : entries;

  // Check if there are draft entries to submit
  const draftEntries = entries.filter((e) => e.status === 'draft');
  const hasDraftEntries = draftEntries.length > 0;

  const goToThisWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSelectedDate(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Zaman Takibi</h1>
          <p className="text-muted-foreground">
            Haftalik calisma surelerinizi takip edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasDraftEntries && (
            <Button variant="outline" onClick={() => setSubmitWeekOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Haftayi Gonder ({draftEntries.length})
            </Button>
          )}
          <Button onClick={() => {
            setDefaultDate(new Date());
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Zaman Girisi
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {format(weekStart, 'dd MMM', { locale: tr })} - {format(addWeeks(weekStart, 1), 'dd MMM yyyy', { locale: tr })}
          </span>
          <span className="text-muted-foreground">({weekKey})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={goToThisWeek}>
          Bu Hafta
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Weekly Summary */}
          <WeeklySummary
            entries={entries}
            weekStart={weekStart}
            onAddEntry={handleAddEntry}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate ?? undefined}
          />

          {/* Entry List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedDate
                    ? format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr })
                    : 'Tum Girisler'}
                </CardTitle>
                {selectedDate && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                    Tumunu Goster
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {selectedDate
                      ? 'Bu tarih icin zaman girisi yok'
                      : 'Bu hafta icin zaman girisi yok'}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setDefaultDate(selectedDate ?? new Date());
                      setFormOpen(true);
                    }}
                  >
                    Ilk girisi ekle
                  </Button>
                </div>
              ) : (
                <TimeEntryList
                  entries={filteredEntries}
                  onEdit={(e) => setEditingEntry(e)}
                  onDelete={(e) => setDeleteEntry(e)}
                  groupByDate={!selectedDate}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Dialog */}
      <TimeEntryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setDefaultDate(undefined);
        }}
        workOrders={workOrders}
        deliverables={deliverables}
        tasks={tasks}
        defaultDate={defaultDate}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <TimeEntryFormDialog
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        timeEntry={editingEntry}
        workOrders={workOrders}
        deliverables={deliverables}
        tasks={tasks}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zaman Girisini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteEntry && (
                <>
                  {format(deleteEntry.date.toDate(), 'dd MMM yyyy', { locale: tr })} tarihli{' '}
                  {formatDuration(deleteEntry.durationMinutes)} surelik girisi silmek istediginizden
                  emin misiniz?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Week Confirmation */}
      <AlertDialog open={submitWeekOpen} onOpenChange={setSubmitWeekOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Haftayi Gonder</AlertDialogTitle>
            <AlertDialogDescription>
              {weekKey} haftasindaki {draftEntries.length} taslak girisi onaya gondermek istediginizden
              emin misiniz? Gonderilen girisler duzenlenemez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitWeek}>Gonder</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
