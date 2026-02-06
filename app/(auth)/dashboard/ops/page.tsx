'use client';

import { useOpsDashboard } from '@/hooks/use-ops-dashboard';
import {
    KPICards,
    WorkOrderRisksPanel,
    TimesheetPanel,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/app-header';

const OPS_KPI_CARDS = ['openWorkOrders', 'pendingTimesheets'];

export default function OpsDashboardPage() {
    const { data, loading, error, refresh } = useOpsDashboard();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Operasyon Dashboard"
                description="İş emirleri ve zaman yönetimi"
            />
            <div className="flex items-center justify-end">
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

            <KPICards
                kpis={data.kpis}
                loading={loading}
                oldestOverdueDays={null}
                thisWeekDeliveryCount={data.thisWeekDeliveryCount}
                visibleCards={OPS_KPI_CARDS}
            />

            <div className="grid gap-4 md:grid-cols-2 auto-rows-min">
                {/* Work Order Risks */}
                <div className="md:col-span-1">
                    <WorkOrderRisksPanel risks={data.workOrderRisks} loading={loading} />
                </div>

                {/* Timesheet Panel */}
                <div className="md:col-span-1">
                    <TimesheetPanel queue={data.timesheetQueue} loading={loading} />
                </div>
            </div>
        </div>
    );
}
