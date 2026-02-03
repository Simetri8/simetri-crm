'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Building2,
    Handshake,
    CheckCircle2,
    Plus,
    AlertCircle,
} from 'lucide-react';
import type { FollowUpItem } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

export type FollowUpsPanelProps = {
    followUps: FollowUpItem[];
    loading: boolean;
};

function formatDate(timestamp: Timestamp | null): string {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
    });
}

function formatRelativeTime(timestamp: Timestamp | null): string {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return `${Math.floor(diffDays / 30)} ay önce`;
}

export function FollowUpsPanel({ followUps, loading }: FollowUpsPanelProps) {
    const router = useRouter();

    const handleItemClick = (item: FollowUpItem) => {
        if (item.type === 'company') {
            router.push(`/crm/companies/${item.id}`);
        } else {
            router.push(`/crm/deals/${item.id}`);
        }
    };

    if (loading) {
        return (
            <Card className="col-span-2 row-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-5 w-40" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const overdueCount = followUps.filter((f) => f.isOverdue).length;

    return (
        <Card className="col-span-2 row-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    Bugün &amp; Geciken Takipler
                    {overdueCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {overdueCount} gecikmiş
                        </Badge>
                    )}
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Aktivite Ekle
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    {followUps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                            <p className="text-sm">Bekleyen takip yok</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {followUps.map((item) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleItemClick(item)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${item.isOverdue
                                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                                            : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`p-2 rounded-full ${item.type === 'company'
                                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                                    : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                                                }`}
                                        >
                                            {item.type === 'company' ? (
                                                <Building2 className="h-4 w-4" />
                                            ) : (
                                                <Handshake className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">{item.title}</span>
                                                {item.isOverdue && (
                                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                                )}
                                            </div>
                                            {item.nextAction && (
                                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                                    {item.nextAction}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span>
                                                    Tarih: {formatDate(item.nextActionDate)}
                                                </span>
                                                <span>
                                                    Son aktivite: {formatRelativeTime(item.lastActivityAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={item.isOverdue ? 'destructive' : 'secondary'}
                                            className="shrink-0"
                                        >
                                            {item.type === 'company' ? 'Şirket' : 'Fırsat'}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
