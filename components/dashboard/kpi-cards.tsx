'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertTriangle,
    Calendar,
    Clock,
    FolderOpen,
    ClipboardList,
    UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DashboardKPIs } from '@/lib/types';

export type KPICardsProps = {
    kpis: DashboardKPIs | null;
    loading: boolean;
    oldestOverdueDays: number | null;
    thisWeekDeliveryCount: number;
    visibleCards?: string[];
};

type KPICardData = {
    key: string;
    title: string;
    value: number;
    subtitle: string | null;
    icon: React.ReactNode;
    colorClass: string;
    entityName: string;
};

function getGridClass(count: number) {
    if (count <= 2) return 'grid gap-4 md:grid-cols-2';
    if (count <= 4) return 'grid gap-4 md:grid-cols-2 lg:grid-cols-4';
    return 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
}

export function KPICards({
    kpis,
    loading,
    oldestOverdueDays,
    thisWeekDeliveryCount,
    visibleCards,
}: KPICardsProps) {
    const skeletonCount = visibleCards?.length ?? 6;

    if (loading) {
        return (
            <div className={getGridClass(skeletonCount)}>
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-1.5">
                                <Skeleton className="h-3.5 w-16" />
                                <Skeleton className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-5 w-12" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const allCards: KPICardData[] = [
        {
            key: 'overdueNextActions',
            title: 'Geciken Takipler',
            value: kpis?.overdueNextActions ?? 0,
            subtitle: oldestOverdueDays
                ? `En eskisi: ${oldestOverdueDays} gün`
                : null,
            icon: <AlertTriangle className="h-10 w-10 opacity-30" />,
            colorClass:
                (kpis?.overdueNextActions ?? 0) > 0
                    ? 'text-red-600'
                    : 'text-muted-foreground',
            entityName: 'FollowUp',
        },
        {
            key: 'todayNextActions',
            title: 'Bugün Yapılacaklar',
            value: kpis?.todayNextActions ?? 0,
            subtitle: null,
            icon: <Calendar className="h-10 w-10 opacity-30" />,
            colorClass:
                (kpis?.todayNextActions ?? 0) > 0
                    ? 'text-blue-600'
                    : 'text-muted-foreground',
            entityName: 'FollowUp',
        },
        {
            key: 'newContacts',
            title: 'Yeni Kişiler',
            value: kpis?.newContacts ?? 0,
            subtitle: 'Son 7 gün',
            icon: <UserPlus className="h-10 w-10 opacity-30" />,
            colorClass:
                (kpis?.newContacts ?? 0) > 0
                    ? 'text-purple-600'
                    : 'text-muted-foreground',
            entityName: 'Contact',
        },
        {
            key: 'openRequests',
            title: 'Açık Talepler',
            value: kpis?.openRequests ?? 0,
            subtitle: null,
            icon: <ClipboardList className="h-10 w-10 opacity-30" />,
            colorClass:
                (kpis?.openRequests ?? 0) > 0
                    ? 'text-amber-600'
                    : 'text-muted-foreground',
            entityName: 'Request',
        },
        {
            key: 'openWorkOrders',
            title: 'Açık İş Emirleri',
            value: kpis?.openWorkOrders ?? 0,
            subtitle:
                thisWeekDeliveryCount > 0
                    ? `Bu hafta teslim: ${thisWeekDeliveryCount}`
                    : null,
            icon: <FolderOpen className="h-10 w-10" />,
            colorClass: 'text-muted-foreground',
            entityName: 'WorkOrder',
        },
        {
            key: 'pendingTimesheets',
            title: 'Onay Bekleyen',
            value: kpis?.pendingTimesheets ?? 0,
            subtitle: null,
            icon: <Clock className="h-10 w-10" />,
            colorClass:
                (kpis?.pendingTimesheets ?? 0) > 0
                    ? 'text-amber-600'
                    : 'text-muted-foreground',
            entityName: 'TimeEntry',
        },
    ];

    const cards = visibleCards
        ? allCards.filter((c) => visibleCards.includes(c.key))
        : allCards;

    return (
        <div className={getGridClass(cards.length)}>
            {cards.map((card) => (
                <Card key={card.key} className="gap-0 relative pb-2">
                    <CardHeader>
                        <CardTitle>{card.title}</CardTitle>
                        <CardDescription>{card.subtitle}</CardDescription>
                        <span className={`${card.colorClass} absolute top-3 right-3`}>{card.icon}</span>
                    </CardHeader>
                    <CardContent className="flex items-end justify-center p-3 h-full">

                       
                            <span className={`text-4xl font-bold leading-none ${card.colorClass}`}>
                                {card.value}
                            </span>
                       


                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
