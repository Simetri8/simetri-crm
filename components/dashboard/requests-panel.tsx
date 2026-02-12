'use client';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowRight,
    ClipboardList,
    Calendar,
    User,
} from 'lucide-react';
import type { RequestSummaryItem } from '@/lib/types';
import {
    REQUEST_TYPE_LABELS,
    REQUEST_PRIORITY_CONFIG,
    REQUEST_STATUS_CONFIG,
} from '@/lib/utils/status';
import { cn } from '@/lib/utils';

export type RequestsPanelProps = {
    requests: RequestSummaryItem[];
    loading: boolean;
    onOpenList?: () => void;
    onSelectRequest?: (requestId: string) => void;
};

export function RequestsPanel({
    requests,
    loading,
    onOpenList,
    onSelectRequest,
}: RequestsPanelProps) {
    if (loading) {
        return (
            <Card className="col-span-1 row-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-5 w-32" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-3 rounded-lg border">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 row-span-1 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4" />
                    Açık Talepler
                </CardTitle>
                <CardAction>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenList}
                        className="gap-1 text-xs"
                    >
                        Tümünü Gör
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="px-4 flex flex-col gap-3">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <ClipboardList className="h-8 w-8 mb-2 text-green-500" />
                        <p className="text-sm">Açık talep yok</p>
                    </div>
                ) : (
                    requests.slice(0, 10).map((request) => {
                        const priorityConfig = REQUEST_PRIORITY_CONFIG[request.priority];
                        const statusConfig = REQUEST_STATUS_CONFIG[request.status];

                        return (
                            <button
                                key={request.id}
                                onClick={() => onSelectRequest?.(request.id)}
                                className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">
                                            {request.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {REQUEST_TYPE_LABELS[request.type]}
                                            {request.companyName && ` · ${request.companyName}`}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className={cn('shrink-0 text-xs', priorityConfig.bgColor, priorityConfig.color)}
                                    >
                                        {priorityConfig.label}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                    <Badge
                                        variant="outline"
                                        className={cn('text-[10px] h-[18px]', statusConfig.color)}
                                    >
                                        {statusConfig.label}
                                    </Badge>
                                    {request.assigneeName && (
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {request.assigneeName}
                                        </span>
                                    )}
                                    {request.dueDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(request.dueDate.toDate(), 'dd MMM', { locale: tr })}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}

            </CardContent>
        </Card>
    );
}
