'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    ShieldAlert,
    CreditCard,
} from 'lucide-react';
import type { WorkOrderRiskItem } from '@/lib/types';
import {
    WORK_ORDER_STATUS_CONFIG,
    PAYMENT_STATUS_CONFIG,
} from '@/lib/utils/status';
import { Timestamp } from 'firebase/firestore';

export type WorkOrderRisksPanelProps = {
    risks: WorkOrderRiskItem[];
    loading: boolean;
};

function getDaysUntilDelivery(timestamp: Timestamp): number {
    const date = timestamp.toDate();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function WorkOrderRisksPanel({
    risks,
    loading,
}: WorkOrderRisksPanelProps) {
    const router = useRouter();

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
        <Card className="col-span-1 row-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldAlert className="h-5 w-5" />
                    İş Emri Riskleri
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/ops/work-orders')}
                    className="gap-1 text-xs"
                >
                    Tümünü Gör
                    <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[220px]">
                    {risks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <ShieldAlert className="h-8 w-8 mb-2 text-green-500" />
                            <p className="text-sm">Riskli iş emri yok</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {risks.map((risk) => {
                                const statusConfig = WORK_ORDER_STATUS_CONFIG[risk.status];
                                const paymentConfig = PAYMENT_STATUS_CONFIG[risk.paymentStatus];
                                const daysUntil = getDaysUntilDelivery(risk.targetDeliveryDate);

                                return (
                                    <button
                                        key={risk.workOrderId}
                                        onClick={() =>
                                            router.push(`/ops/work-orders/${risk.workOrderId}`)
                                        }
                                        className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${risk.isOverdue
                                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                                            : risk.isDueSoon
                                                ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                                                : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">
                                                    {risk.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {risk.companyName}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`shrink-0 text-xs ${statusConfig.color} ${statusConfig.bgColor}`}
                                            >
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                            <span
                                                className={`flex items-center gap-1 ${risk.isOverdue
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : risk.isDueSoon
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-muted-foreground'
                                                    }`}
                                            >
                                                <Calendar className="h-3 w-3" />
                                                {risk.isOverdue
                                                    ? `${Math.abs(daysUntil)} gün gecikti`
                                                    : daysUntil === 0
                                                        ? 'Bugün'
                                                        : `${daysUntil} gün kaldı`}
                                            </span>

                                            {risk.blockedDeliverables > 0 && (
                                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {risk.blockedDeliverables} engelli
                                                </span>
                                            )}

                                            {risk.paymentStatus !== 'paid' &&
                                                risk.paymentStatus !== 'unplanned' && (
                                                    <span
                                                        className={`flex items-center gap-1 ${paymentConfig.color}`}
                                                    >
                                                        <CreditCard className="h-3 w-3" />
                                                        {paymentConfig.label}
                                                    </span>
                                                )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
