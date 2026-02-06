'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    const allCards: KPICardData[] = [
        {
            key: 'overdueNextActions',
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
            entityName: 'FollowUp',
        },
        {
            key: 'todayNextActions',
            title: 'Bugün Yapılacaklar',
            value: kpis?.todayNextActions ?? 0,
            subtitle: null,
            icon: <Calendar className="h-4 w-4" />,
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
            icon: <UserPlus className="h-4 w-4" />,
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
            icon: <ClipboardList className="h-4 w-4" />,
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
            icon: <FolderOpen className="h-4 w-4" />,
            colorClass: 'text-muted-foreground',
            entityName: 'WorkOrder',
        },
        {
            key: 'pendingTimesheets',
            title: 'Onay Bekleyen',
            value: kpis?.pendingTimesheets ?? 0,
            subtitle: null,
            icon: <Clock className="h-4 w-4" />,
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
                <Card key={card.key}>
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
                        <div className="mt-2 text-xs">
                            <Badge variant="outline" className="h-[20px] px-2 py-0 text-[10px] font-normal text-muted-foreground">
                                {card.entityName}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
