'use client';

import { useOverviewDashboard } from '@/hooks/use-overview-dashboard';
import { KPICards } from '@/components/dashboard';
import { DashboardNavCards } from '@/components/dashboard/dashboard-nav-cards';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle, Sprout, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/app-header';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { seedFlowData, wipeAllData } from '@/lib/firebase/seed-flow';

export default function DashboardPage() {
    const { data, loading, error, refresh } = useOverviewDashboard();
    const [isSeeding, setIsSeeding] = useState(false);
    const [isWiping, setIsWiping] = useState(false);

    const { user } = useAuth();
    const router = useRouter();

    const handleSeed = async () => {
        if (!user) return;

        setIsSeeding(true);
        try {
            await seedFlowData(user.uid);
            toast.success('Test verileri oluşturuldu');
            refresh();
        } catch (error) {
            console.error('Seed error:', error);
            toast.error('Seed işlemi başarısız oldu');
        } finally {
            setIsSeeding(false);
        }
    };

    const handleWipe = async () => {
        if (!confirm('Tüm veriler silinecek (kullanıcılar hariç). Emin misiniz?')) return;

        setIsWiping(true);
        try {
            await wipeAllData();
            toast.success('Tüm veriler silindi');
            refresh();
        } catch (error) {
            console.error('Wipe error:', error);
            toast.error('Silme işlemi başarısız oldu');
        } finally {
            setIsWiping(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                description="Genel görünüm"
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
                thisWeekDeliveryCount={data.thisWeekDeliveryCount}
            />

            <DashboardNavCards />

            {process.env.NODE_ENV === 'development' && (
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Geliştirme ortamında örnek bir şirket ve tam akış senaryolarını hızlıca oluşturabilirsiniz.
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleWipe}
                            disabled={isWiping || isSeeding}
                            variant="outline"
                            className="w-full md:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isWiping ? 'Siliniyor...' : 'Tüm Verileri Sil'}
                        </Button>
                        <Button
                            onClick={handleSeed}
                            disabled={isSeeding || isWiping}
                            variant="outline"
                            className="w-full md:w-auto"
                        >
                            <Sprout className="mr-2 h-4 w-4" />
                            {isSeeding ? 'Oluşturuluyor...' : 'Test Verisi Oluştur'}
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}
