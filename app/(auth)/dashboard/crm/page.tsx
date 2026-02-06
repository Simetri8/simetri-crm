'use client';

import { useCrmDashboard } from '@/hooks/use-crm-dashboard';
import {
    KPICards,
    FollowUpsPanel,
    NetworkingPanel,
    RequestsPanel,
    PipelineSummaryPanel,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/app-header';

const CRM_KPI_CARDS = [
    'overdueNextActions',
    'todayNextActions',
    'newContacts',
    'openRequests',
];

export default function CrmDashboardPage() {
    const { data, loading, error, refresh } = useCrmDashboard();

    return (
        <div className="space-y-6">
            <PageHeader
                title="CRM Dashboard"
                description="Takipler, pipeline ve networking"
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
                oldestOverdueDays={data.oldestOverdueDays}
                thisWeekDeliveryCount={0}
                visibleCards={CRM_KPI_CARDS}
            />

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

                {/* Networking Panel - 1 column */}
                <div className="md:col-span-1 lg:col-span-1">
                    <NetworkingPanel contacts={data.networkingContacts} loading={loading} />
                </div>

                {/* Requests Panel - 2 columns */}
                <div className="md:col-span-2 lg:col-span-2">
                    <RequestsPanel requests={data.openRequests} loading={loading} />
                </div>
            </div>
        </div>
    );
}
