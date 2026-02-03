'use client';

import { useDashboard } from '@/hooks/use-dashboard';
import {
    KPICards,
    FollowUpsPanel,
    PipelineSummaryPanel,
    WorkOrderRisksPanel,
    TimesheetPanel,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
    const { data, loading, error, refresh } = useDashboard();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Bugün neyi unutmamalıyım?
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                    className="gap-2"
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </Button>
            </div>

            {/* Error State */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div>
                            <p className="font-medium text-red-800 dark:text-red-200">
                                Veri yüklenirken hata oluştu
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {error.message}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refresh}
                            className="ml-auto"
                        >
                            Tekrar Dene
                        </Button>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <KPICards
                kpis={data.kpis}
                loading={loading}
                oldestOverdueDays={data.oldestOverdueDays}
                thisWeekDeliveryCount={data.thisWeekDeliveryCount}
            />

            {/* Bento Grid Layout */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-min">
                {/* Follow-ups Panel - 2 columns, 2 rows */}
                <div className="md:col-span-2 lg:col-span-2 lg:row-span-2">
                    <FollowUpsPanel followUps={data.followUps} loading={loading} />
                </div>

                {/* Pipeline Summary - 1 column */}
                <div className="md:col-span-1 lg:col-span-1">
                    <PipelineSummaryPanel
                        summary={data.pipelineSummary}
                        loading={loading}
                    />
                </div>

                {/* Work Order Risks - 1 column */}
                <div className="md:col-span-1 lg:col-span-1">
                    <WorkOrderRisksPanel risks={data.workOrderRisks} loading={loading} />
                </div>

                {/* Timesheet Panel - 2 columns */}
                <div className="md:col-span-2 lg:col-span-2">
                    <TimesheetPanel queue={data.timesheetQueue} loading={loading} />
                </div>
            </div>
        </div>
    );
}
