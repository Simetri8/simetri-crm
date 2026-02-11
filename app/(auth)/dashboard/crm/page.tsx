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
import { AlertCircle } from 'lucide-react';
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
        <div className=" space-y-4">
            <PageHeader
                title="CRM Dashboard"
                description="Takipler, pipeline ve networking"
            />

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

            <div className="grid gap-3 lg:grid-cols-3">
                <NetworkingPanel contacts={data.networkingContacts} loading={loading} />
                <FollowUpsPanel followUps={data.followUps} loading={loading} />
                <RequestsPanel requests={data.openRequests} loading={loading} />
            </div>
        </div>
    );
}
