'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Check, ChevronDown, ChevronRight, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { TimeEntryList } from '@/components/time/time-entry-list';
import { timeEntryService } from '@/lib/firebase/time-entries';
import { useAuth } from '@/components/auth/auth-provider';
import { formatDuration } from '@/lib/utils/status';
import type { TimeEntry, TimesheetQueueItem } from '@/lib/types';
import { PageHeader } from '@/components/layout/app-header';

export default function TimeApprovalPage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<TimesheetQueueItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [entriesByKey, setEntriesByKey] = useState<Record<string, TimeEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [approveItem, setApproveItem] = useState<TimesheetQueueItem | null>(null);

  const loadQueue = async () => {
    try {
      const data = await timeEntryService.getPendingApproval();
      setQueue(data);
    } catch (error) {
      console.error('Error loading approval queue:', error);
      toast.error('Onay kuyruğu yüklenemedi');
    }
  };

  const loadEntriesForItem = async (userId: string, weekKey: string) => {
    const key = `${userId}_${weekKey}`;
    if (entriesByKey[key]) return; // Already loaded

    try {
      const entries = await timeEntryService.getByUserAndWeek(userId, weekKey);
      setEntriesByKey((prev) => ({
        ...prev,
        [key]: entries.filter((e) => e.status === 'submitted'),
      }));
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Girişler yüklenemedi');
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await loadQueue();
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleToggleItem = async (item: TimesheetQueueItem) => {
    const key = `${item.userId}_${item.weekKey}`;
    if (expandedItems.has(key)) {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } else {
      setExpandedItems((prev) => new Set(prev).add(key));
      await loadEntriesForItem(item.userId, item.weekKey);
    }
  };

  const handleApprove = async () => {
    if (!user || !approveItem) return;
    try {
      await timeEntryService.approveWeek(
        approveItem.userId,
        approveItem.weekKey,
        user.uid
      );
      toast.success('Hafta onaylandı');
      setApproveItem(null);
      await loadQueue();
      // Clear cached entries for this item
      const key = `${approveItem.userId}_${approveItem.weekKey}`;
      setEntriesByKey((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (error) {
      console.error('Error approving week:', error);
      toast.error('Hafta onaylanamadı');
    }
  };

  // Parse weekKey to get week dates
  const getWeekDates = (weekKey: string) => {
    const [year, week] = weekKey.split('-W').map(Number);
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const weekStartDate = addDays(firstDayOfYear, daysOffset - firstDayOfYear.getDay() + 1);
    const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    return { weekStart, weekEnd };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Timesheet Onayları"
        description="Onay bekleyen haftalık zaman girişleri"
      />

      {/* Queue */}
      {queue.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">Tüm onaylar tamamlandı</p>
            <p className="text-muted-foreground text-sm">
              Onay bekleyen zaman girişi yok
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => {
            const key = `${item.userId}_${item.weekKey}`;
            const isExpanded = expandedItems.has(key);
            const entries = entriesByKey[key] || [];
            const { weekStart, weekEnd } = getWeekDates(item.weekKey);

            return (
              <Card key={key}>
                <Collapsible open={isExpanded} onOpenChange={() => handleToggleItem(item)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>

                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.userName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(weekStart, 'dd MMM', { locale: tr })} -{' '}
                            {format(weekEnd, 'dd MMM yyyy', { locale: tr })} ({item.weekKey})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-lg">
                              {formatDuration(item.submittedMinutes)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.entryCount} giriş
                          </p>
                        </div>
                        <Badge variant="secondary">Onay Bekliyor</Badge>
                        <Button onClick={() => setApproveItem(item)}>
                          <Check className="mr-2 h-4 w-4" />
                          Onayla
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {entries.length > 0 ? (
                        <TimeEntryList entries={entries} groupByDate={true} />
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Confirmation */}
      <AlertDialog open={!!approveItem} onOpenChange={(open) => !open && setApproveItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Haftayı Onayla</AlertDialogTitle>
            <AlertDialogDescription>
              {approveItem && (
                <>
                  {approveItem.userName} kullanıcısının {approveItem.weekKey} haftası için{' '}
                  {approveItem.entryCount} adet girişi ({formatDuration(approveItem.submittedMinutes)}) onaylamak
                  istediğinizden emin misiniz? Onaylanan girişler artık düzenlenemez.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Onayla</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
