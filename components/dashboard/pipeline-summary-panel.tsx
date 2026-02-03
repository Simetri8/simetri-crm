'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';
import type { PipelineStageSummary, DealStage } from '@/lib/types';
import { DEAL_STAGE_CONFIG, formatMoney } from '@/lib/utils/status';

export type PipelineSummaryPanelProps = {
    summary: PipelineStageSummary[];
    loading: boolean;
    staleProposalCount?: number;
};

const ACTIVE_STAGES: DealStage[] = [
    'lead',
    'qualified',
    'proposal-prep',
    'proposal-sent',
    'negotiation',
];

export function PipelineSummaryPanel({
    summary,
    loading,
    staleProposalCount = 0,
}: PipelineSummaryPanelProps) {
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
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sadece aktif stage'leri goster (won/lost haric)
    const activeSummary = summary.filter((s) =>
        ACTIVE_STAGES.includes(s.stage)
    );

    const totalDeals = activeSummary.reduce((sum, s) => sum + s.count, 0);
    const totalBudget = activeSummary.reduce(
        (sum, s) => sum + s.sumEstimatedBudgetMinor,
        0
    );

    return (
        <Card className="col-span-1 row-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5" />
                    Pipeline Özeti
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/crm/pipeline')}
                    className="gap-1 text-xs"
                >
                    Tümünü Gör
                    <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent>
                {staleProposalCount > 0 && (
                    <div className="mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                                {staleProposalCount} teklif 7+ gündür yanıt bekliyor
                            </span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {activeSummary.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Aktif fırsat yok
                        </p>
                    ) : (
                        activeSummary.map((item) => {
                            const config = DEAL_STAGE_CONFIG[item.stage];
                            return (
                                <div
                                    key={item.stage}
                                    className="flex items-center justify-between py-1.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`text-xs ${config.color} ${config.bgColor}`}
                                        >
                                            {config.label}
                                        </Badge>
                                        <span className="text-sm font-medium">{item.count}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {formatMoney(item.sumEstimatedBudgetMinor, 'TRY')}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {totalDeals > 0 && (
                    <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm font-medium">
                            <span>Toplam ({totalDeals} fırsat)</span>
                            <span className="text-green-600 dark:text-green-400">
                                {formatMoney(totalBudget, 'TRY')}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
