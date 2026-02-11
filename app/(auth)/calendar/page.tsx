'use client';

import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, Calendar, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isSameDay, isToday, startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    CalendarProvider,
    CalendarDate,
    CalendarDatePicker,
    CalendarMonthPicker,
    CalendarYearPicker,
    CalendarDatePagination,
    CalendarHeader,
    CalendarBody,
    CalendarItem,
    useCalendarMonth,
    useCalendarYear,
} from '@/components/kibo-ui/calendar';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import {
    CALENDAR_SOURCE_COLORS,
    CALENDAR_SOURCE_LABELS,
    type CalendarEventSource,
} from '@/lib/firebase/calendar';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/app-header';

const ALL_SOURCES: CalendarEventSource[] = [
    'contact',
    'deal',
    'company',
    'work-order',
    'request',
];

// Gelişmiş renk paleti (bg, border, text)
const SOURCE_COLOR_SCHEME: Record<
    CalendarEventSource,
    { bg: string; border: string; text: string }
> = {
    contact: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    deal: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    company: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
    'work-order': { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
    request: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
};

function CalendarContent() {
    const router = useRouter();
    const [month] = useCalendarMonth();
    const [year] = useCalendarYear();
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

    const {
        events,
        features,
        loading,
        error,
        activeSources,
        toggleSource,
    } = useCalendarEvents(year, month);

    // İstatistikler
    const stats = useMemo(() => {
        const sourceStats = ALL_SOURCES.map((source) => ({
            source,
            count: events.filter((e) => e.source === source).length,
        }));

        const todayEvents = events.filter((e) => isToday(e.date));
        const upcomingEvents = events.filter(
            (e) => e.date > new Date() && !isToday(e.date)
        );

        return {
            sourceStats,
            total: events.length,
            today: todayEvents.length,
            upcoming: upcomingEvents.length,
        };
    }, [events]);

    // Haftalık görünüm için günler
    const weekDays = useMemo(() => {
        return eachDayOfInterval({
            start: weekStart,
            end: endOfWeek(weekStart, { weekStartsOn: 1 }),
        });
    }, [weekStart]);

    // Haftalık görünüm için etkinlikler
    const weekEvents = useMemo(() => {
        return weekDays.map((day) => ({
            day,
            events: events.filter((e) => isSameDay(e.date, day)),
        }));
    }, [weekDays, events]);

    return (
        <div className="flex flex-col gap-4">

            {/* Basitleştirilmiş Filtre + İstatistik + Görünüm Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {ALL_SOURCES.map((source) => {
                        const active = activeSources.includes(source);
                        const count = stats.sourceStats.find((s) => s.source === source)?.count || 0;
                        return (
                            <button
                                key={source}
                                onClick={() => toggleSource(source)}
                                className={cn(
                                    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                                    active
                                        ? 'border-transparent bg-accent text-accent-foreground shadow-sm'
                                        : 'border-border bg-background text-muted-foreground opacity-60 hover:opacity-100'
                                )}
                            >
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{
                                        backgroundColor: active
                                            ? CALENDAR_SOURCE_COLORS[source]
                                            : '#a1a1aa',
                                    }}
                                />
                                {CALENDAR_SOURCE_LABELS[source]}
                                <span className="ml-1 rounded-full bg-background/50 px-1.5 py-0.5 font-bold">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Görünüm Modu Toggle (İkonlar) */}
                <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
                    <Button
                        variant={viewMode === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('month')}
                        className="h-8 w-8 p-0"
                        title="Ay Görünümü"
                    >
                        <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('week')}
                        className="h-8 w-8 p-0"
                        title="Hafta Görünümü"
                    >
                        <CalendarDays className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Takvim */}
            {viewMode === 'month' ? (
                <div className="relative rounded-lg border bg-card">
                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    <CalendarDate>
                        <CalendarDatePicker>
                            <CalendarMonthPicker />
                            <CalendarYearPicker start={2024} end={2030} />
                        </CalendarDatePicker>
                        <CalendarDatePagination />
                    </CalendarDate>

                    <CalendarHeader />

                    <CalendarBody features={features}>
                        {({ feature }) => {
                            // Orijinal CalendarEvent'i bul
                            const event = events.find((e) => e.id === feature.id);
                            const scheme = SOURCE_COLOR_SCHEME[event?.source || 'contact'];

                            // Bugünkü etkinlik mi?
                            const isEventToday = event ? isToday(event.date) : false;

                            return (
                                <TooltipProvider key={feature.id}>
                                    <Tooltip delayDuration={200}>
                                        <TooltipTrigger asChild>
                                            <button
                                                className={cn(
                                                    'w-full text-left transition-all hover:scale-105',
                                                    isEventToday && 'ring-2 ring-primary ring-offset-1'
                                                )}
                                                onClick={() => {
                                                    if (event?.url) {
                                                        router.push(event.url);
                                                    }
                                                }}
                                            >
                                                <div
                                                    className="rounded px-1.5 py-0.5 text-xs font-medium"
                                                    style={{
                                                        backgroundColor: scheme.bg,
                                                        color: scheme.text,
                                                    }}
                                                >
                                                    <span className="truncate">
                                                        {feature.name}
                                                    </span>
                                                </div>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="max-w-xs"
                                            style={{
                                                backgroundColor: scheme.bg,
                                                borderColor: scheme.border,
                                                color: scheme.text,
                                            }}
                                        >
                                            <div className="space-y-1">
                                                <p className="font-semibold">{feature.name}</p>
                                                {event?.subtitle && (
                                                    <p className="text-xs opacity-80">
                                                        {event.subtitle}
                                                    </p>
                                                )}
                                                <p className="text-xs opacity-60">
                                                    {CALENDAR_SOURCE_LABELS[event?.source || 'contact']}
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }}
                    </CalendarBody>
                </div>
            ) : (
                /* Haftalık Görünüm */
                <div className="rounded-lg border bg-card p-4">
                    {/* Hafta Navigasyonu */}
                    <div className="mb-4 flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                        >
                            ← Önceki Hafta
                        </Button>
                        <h3 className="text-sm font-semibold">
                            {format(weekStart, 'd MMMM', { locale: tr })} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'd MMMM yyyy', { locale: tr })}
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                        >
                            Sonraki Hafta →
                        </Button>
                    </div>

                    {/* Haftalık Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {weekEvents.map(({ day, events: dayEvents }) => {
                            const today = isToday(day);
                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        'flex min-h-[240px] flex-col rounded-lg border p-3',
                                        today && 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    )}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className={cn(
                                            'text-xs font-medium',
                                            today ? 'text-primary' : 'text-muted-foreground'
                                        )}>
                                            {format(day, 'EEE', { locale: tr })}
                                        </span>
                                        <span className={cn(
                                            'text-lg font-bold',
                                            today && 'text-primary'
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {dayEvents.map((event) => {
                                            const scheme = SOURCE_COLOR_SCHEME[event.source];
                                            return (
                                                <button
                                                    key={event.id}
                                                    className="w-full text-left transition-all hover:scale-[1.02] hover:shadow-md"
                                                    onClick={() => router.push(event.url)}
                                                >
                                                    <div
                                                        className="flex flex-col gap-1.5 rounded-md border px-3 py-2"
                                                        style={{
                                                            backgroundColor: scheme.bg,
                                                            borderColor: scheme.border,
                                                            color: scheme.text,
                                                        }}
                                                    >
                                                        <div className="flex-1 space-y-0.5">
                                                            <p className="font-semibold leading-tight text-sm">
                                                                {event.title}
                                                            </p>
                                                            {event.subtitle && (
                                                                <p className="text-xs leading-tight opacity-75">
                                                                    {event.subtitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {dayEvents.length === 0 && (
                                            <span className="text-xs text-muted-foreground/50">
                                                Etkinlik yok
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Özet */}
            {!loading && stats.total > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <p>
                        Bu ay toplam <strong className="text-foreground">{stats.total}</strong> etkinlik
                        {stats.today > 0 && (
                            <>
                                , bugün <strong className="text-primary">{stats.today}</strong>
                            </>
                        )}
                        {stats.upcoming > 0 && (
                            <>
                                , yaklaşan <strong className="text-foreground">{stats.upcoming}</strong>
                            </>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function CalendarPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title="Takvim"
                description="Takipler, teslim tarihleri ve taleplerin aylık görünümü"
            />

            <CalendarProvider locale="tr-TR" startDay={1} className="w-full">
                <CalendarContent />
            </CalendarProvider>
        </div>
    );
}
