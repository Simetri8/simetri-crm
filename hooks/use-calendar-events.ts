'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  calendarService,
  type CalendarEvent,
  type CalendarEventSource,
} from '@/lib/firebase/calendar';
import type { Feature, Status } from '@/components/kibo-ui/calendar';

// CalendarEvent → Feature dönüşümü (Kibo Calendar format)
function toFeature(event: CalendarEvent): Feature {
  const status: Status = {
    id: event.source,
    name: event.source,
    color: event.color,
  };

  return {
    id: event.id,
    name: event.title,
    startAt: event.date,
    endAt: event.date,
    status,
  };
}

export type UseCalendarEventsReturn = {
  events: CalendarEvent[];
  features: Feature[];
  loading: boolean;
  error: string | null;
  activeSources: CalendarEventSource[];
  toggleSource: (source: CalendarEventSource) => void;
  refresh: () => void;
};

const ALL_SOURCES: CalendarEventSource[] = [
  'contact',
  'deal',
  'company',
  'work-order',
  'request',
];

export function useCalendarEvents(
  year: number,
  month: number
): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSources, setActiveSources] =
    useState<CalendarEventSource[]>(ALL_SOURCES);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarService.getEventsForMonth(
        year,
        month,
        activeSources.length > 0 ? activeSources : undefined
      );
      setEvents(data);
    } catch (err) {
      console.error('Takvim verileri alınamadı:', err);
      setError('Takvim verileri yüklenirken bir hata oluştu.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, activeSources]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const toggleSource = useCallback((source: CalendarEventSource) => {
    setActiveSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  }, []);

  const features = events.map(toFeature);

  return {
    events,
    features,
    loading,
    error,
    activeSources,
    toggleSource,
    refresh: fetchEvents,
  };
}
