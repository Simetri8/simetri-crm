'use client';

import { useEffect, useState } from 'react';
import { companyService } from '@/lib/firebase/companies';
import Link from 'next/link';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { COMPANY_STATUS_CONFIG } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { Company } from '@/lib/types';
import { PageHeader } from '@/components/layout/app-header';

export default function FlowViewPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

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
