'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import type { TimesheetQueueItem } from '@/lib/types';
import { formatDuration } from '@/lib/utils/status';

export type TimesheetPanelProps = {
    queue: TimesheetQueueItem[];
    loading: boolean;
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatWeekLabel(weekKey: string): string {
    // weekKey format: "2026-W05"
    const match = weekKey.match(/(\d{4})-W(\d{2})/);
    if (!match) return weekKey;
    return `Hafta ${parseInt(match[2], 10)}`;
}

export function TimesheetPanel({ queue, loading }: TimesheetPanelProps) {
    const router = useRouter();

    if (loading) {
        return (
            <Card className="col-span-2 row-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-5 w-40" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-2 row-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Timesheet Onay Kuyruğu
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/time/approve')}
                    className="gap-1 text-xs"
                >
                    Tümünü Gör
                    <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[180px]">
                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                            <p className="text-sm">Onay bekleyen giriş yok</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {queue.map((item) => (
                                <div
                                    key={`${item.userId}-${item.weekKey}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs bg-primary/10">
                                            {getInitials(item.userName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {item.userName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatWeekLabel(item.weekKey)} • {item.entryCount} giriş
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-medium text-sm">
                                            {formatDuration(item.submittedMinutes)}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs mt-1"
                                            onClick={() =>
                                                router.push(
                                                    `/time/approve?user=${item.userId}&week=${item.weekKey}`
                                                )
                                            }
                                        >
                                            İncele
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="mt-4 text-xs">
                    <Badge variant="outline" className="h-[20px] px-2 py-0 text-[10px] font-normal text-muted-foreground">
                        TimeEntry
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
