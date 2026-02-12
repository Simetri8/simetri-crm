'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon, CheckCircle2, Edit2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Timestamp } from 'firebase/firestore';

type NextActionBarProps = {
  nextAction: string | null;
  nextActionDate: Timestamp | null;
  ownerName?: string | null;
  onUpdate: (nextAction: string | null, nextActionDate: Date | null) => Promise<void>;
  isOverdue?: boolean;
};

function formatTimeValue(date: Date | undefined): string {
  if (!date) return '';
  return format(date, 'HH:mm');
}

function withOptionalTime(date: Date | undefined, timeValue: string): Date | null {
  if (!date) return null;
  if (!timeValue) return date;

  const [hours, minutes] = timeValue.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return date;

  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function formatDateWithOptionalTime(date: Date): string {
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime
    ? format(date, 'dd MMM yyyy HH:mm', { locale: tr })
    : format(date, 'dd MMM yyyy', { locale: tr });
}

export function NextActionBar({
  nextAction,
  nextActionDate,
  ownerName,
  onUpdate,
  isOverdue,
}: NextActionBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAction, setEditAction] = useState(nextAction ?? '');
  const [editDate, setEditDate] = useState<Date | undefined>(
    nextActionDate?.toDate()
  );
  const [editTime, setEditTime] = useState(
    formatTimeValue(nextActionDate?.toDate())
  );
  const [editDatePopoverOpen, setEditDatePopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate(editAction || null, withOptionalTime(editDate, editTime));
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    // Tamamlandı - kullanicidan yeni action istenecek
    setEditAction('');
    setEditDate(undefined);
    setEditTime('');
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
        <div className="flex-1">
          <Input
            placeholder="Sonraki adim..."
            value={editAction}
            onChange={(e) => setEditAction(e.target.value)}
            className="h-9"
          />
        </div>
        <Popover open={editDatePopoverOpen} onOpenChange={setEditDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-9 w-[180px] justify-start text-left font-normal',
                !editDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {editDate ? formatDateWithOptionalTime(editDate) : 'Tarih sec'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={editDate}
              onSelect={(date) => {
                setEditDate(date);
                setEditDatePopoverOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          className="h-9 w-[130px]"
        />
        <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
          Kaydet
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsEditing(false);
            setEditAction(nextAction ?? '');
            setEditDate(nextActionDate?.toDate());
            setEditTime(formatTimeValue(nextActionDate?.toDate()));
          }}
        >
          İptal
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        isOverdue && 'border-red-300 bg-red-50',
        !isOverdue && nextAction && 'bg-amber-50 border-amber-200'
      )}
    >
      <div className="flex-1">
        {nextAction ? (
          <div className="flex items-center gap-2">
            <span className="font-medium">{nextAction}</span>
            {nextActionDate && (
              <span
                className={cn(
                  'text-sm',
                  isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                )}
              >
                ({formatDateWithOptionalTime(nextActionDate.toDate())})
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Sonraki adim belirlenmedi</span>
        )}
      </div>

      {ownerName && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          {ownerName}
        </div>
      )}

      <div className="flex items-center gap-1">
        {nextAction && (
          <Button size="sm" variant="ghost" onClick={handleComplete}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Tamamlandı
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditAction(nextAction ?? '');
            setEditDate(nextActionDate?.toDate());
            setEditTime(formatTimeValue(nextActionDate?.toDate()));
            setIsEditing(true);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
