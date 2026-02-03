'use client';

import { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDuration } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { TimeEntry } from '@/lib/types';

type WeeklySummaryProps = {
  entries: TimeEntry[];
  weekStart: Date;
  targetHoursPerDay?: number;
  onAddEntry?: (date: Date) => void;
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
};

export function WeeklySummary({
  entries,
  weekStart,
  targetHoursPerDay = 8,
  onAddEntry,
  onSelectDate,
  selectedDate,
}: WeeklySummaryProps) {
  // Generate days of the week
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, TimeEntry[]> = {};
    entries.forEach((entry) => {
      const dateKey = format(entry.date.toDate(), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  }, [entries]);

  // Calculate totals
  const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);
  const billableMinutes = entries.filter((e) => e.billable).reduce((acc, e) => acc + e.durationMinutes, 0);
  const targetMinutes = targetHoursPerDay * 60 * 5; // 5 working days

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Sure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
            <Progress
              value={Math.min((totalMinutes / targetMinutes) * 100, 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Hedef: {formatDuration(targetMinutes)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturalanabilir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatDuration(billableMinutes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              %{totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0} faturalanabilir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dahili
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {formatDuration(totalMinutes - billableMinutes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              %{totalMinutes > 0 ? Math.round(((totalMinutes - billableMinutes) / totalMinutes) * 100) : 0} dahili
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Day Cards */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEntries = entriesByDate[dateKey] || [];
          const dayMinutes = dayEntries.reduce((acc, e) => acc + e.durationMinutes, 0);
          const dayTargetMinutes = targetHoursPerDay * 60;
          const isToday = isSameDay(day, today);
          const isPast = day < today;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <Card
              key={dateKey}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary',
                isToday && 'border-primary',
                isWeekend && 'bg-muted/30'
              )}
              onClick={() => onSelectDate?.(day)}
            >
              <CardHeader className="p-2 pb-0">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isToday && 'text-primary',
                      isWeekend && 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'EEE', { locale: tr })}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      isToday
                        ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center'
                        : 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                {dayMinutes > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatDuration(dayMinutes)}</span>
                    </div>
                    {!isWeekend && (
                      <Progress
                        value={Math.min((dayMinutes / dayTargetMinutes) * 100, 100)}
                        className="h-1"
                      />
                    )}
                    <div className="flex flex-wrap gap-1">
                      {dayEntries.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1">
                          {dayEntries.length} giris
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    {isPast && !isWeekend ? (
                      <span className="text-xs text-muted-foreground">-</span>
                    ) : onAddEntry && !isWeekend ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddEntry(day);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
