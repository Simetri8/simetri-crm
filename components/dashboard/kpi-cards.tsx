'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertTriangle,
    Calendar,
    Clock,
    FolderOpen,
} from 'lucide-react';
import type { DashboardKPIs } from '@/lib/types';

export type KPICardsProps = {
    kpis: DashboardKPIs | null;
    loading: boolean;
    oldestOverdueDays: number | null;
    thisWeekDeliveryCount: number;
};

type KPICardData = {
    title: string;
    value: number;
    subtitle: string | null;
    icon: React.ReactNode;
    colorClass: string;
};

export function KPICards({
    kpis,
    loading,
    oldestOverdueDays,
    thisWeekDeliveryCount,
}: KPICardsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const cards: KPICardData[] = [
        {
            title: 'Geciken Takipler',
            value: kpis?.overdueNextActions ?? 0,
            subtitle: oldestOverdueDays
                ? `En eskisi: ${oldestOverdueDays} gün`
                : null,
            icon: <AlertTriangle className="h-4 w-4" />,
            colorClass:
                (kpis?.overdueNextActions ?? 0) > 0
                    ? 'text-red-600'
                    : 'text-muted-foreground',
        },
        {
            title: 'Bugün Yapılacaklar',
            value: kpis?.todayNextActions ?? 0,
            subtitle: null,
            icon: <Calendar className="h-4 w-4" />,
            colorClass:
                (kpis?.todayNextActions ?? 0) > 0
                    ? 'text-blue-600'
                    : 'text-muted-foreground',
        },
        {
            title: 'Açık İş Emirleri',
            value: kpis?.openWorkOrders ?? 0,
            subtitle:
                thisWeekDeliveryCount > 0
                    ? `Bu hafta teslim: ${thisWeekDeliveryCount}`
                    : null,
            icon: <FolderOpen className="h-4 w-4" />,
            colorClass: 'text-muted-foreground',
        },
        {
            title: 'Onay Bekleyen Zaman Girişleri',
            value: kpis?.pendingTimesheets ?? 0,
            subtitle: null,
            icon: <Clock className="h-4 w-4" />,
            colorClass:
                (kpis?.pendingTimesheets ?? 0) > 0
                    ? 'text-amber-600'
                    : 'text-muted-foreground',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <span className={card.colorClass}>{card.icon}</span>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${card.colorClass}`}>
                            {card.value}
                        </div>
                        {card.subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {card.subtitle}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
