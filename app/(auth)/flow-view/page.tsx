'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { companyService } from '@/lib/firebase/companies';
import { seedFlowData } from '@/lib/firebase/seed-flow';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import { Building2, ArrowRight, Loader2, Sprout } from 'lucide-react';
import { COMPANY_STATUS_CONFIG } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Company } from '@/lib/types';
import { PageHeader } from '@/components/layout/app-header';

export default function FlowViewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companyService.getAll({
          isArchived: false,
        });
        setCompanies(data);
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const handleSeed = async () => {
    if (!user) return;

    setIsSeeding(true);
    try {
      const companyId = await seedFlowData(user.uid);
      toast.success('Test şirketi ve tüm senaryolar oluşturuldu');
      router.push(`/flow-view/${companyId}`);
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Seed işlemi başarısız oldu');
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="İş Akışı Görünümü"
        description="Şirket seçerek müşteri temaslarından task kapatmaya kadar tüm akışı görselleştirin"
      />

      {process.env.NODE_ENV === 'development' && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Geliştirme ortamında örnek bir şirket ve tam akış senaryolarını hızlıca oluşturabilirsiniz.
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSeed}
              disabled={isSeeding}
              variant="outline"
              className="w-full md:w-auto"
            >
              <Sprout className="mr-2 h-4 w-4" />
              {isSeeding ? 'Test Verisi Oluşturuluyor...' : 'Test Verisi Oluştur (Tüm Senaryolar)'}
            </Button>
            <p className="hidden text-xs text-muted-foreground md:block">
              Her nesne türünün her durumu için en az 2 kayıt oluşturur.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => {
          const statusConfig = COMPANY_STATUS_CONFIG[company.status];
          return (
            <Link
              key={company.id}
              href={`/flow-view/${company.id}`}
              className="group p-6 border rounded-lg hover:shadow-lg transition-all hover:border-primary"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1',
                        statusConfig.bgColor,
                        statusConfig.color
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>

              {company.nextAction && (
                <p className="text-sm text-muted-foreground mt-2">
                  Sonraki Adım: {company.nextAction}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {companies.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Henüz şirket bulunmuyor</p>
        </div>
      )}
    </div>
  );
}
