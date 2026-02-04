'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchCompanyFlowData } from '@/lib/flow/data-fetcher';
import { FlowContainer } from '@/components/flow/flow-container';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Node, Edge } from '@xyflow/react';
import { PageHeader } from '@/components/layout/app-header';

export default function CompanyFlowPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlowData = async () => {
      try {
        const data = await fetchCompanyFlowData(companyId);
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (err) {
        console.error('Error loading flow data:', err);
        setError('Veri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      loadFlowData();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <PageHeader
          title="İş Akışı Görünümü"
          description="Şirket için iş akışı verileri yüklenemedi"
        />
        <p className="text-muted-foreground">{error || 'Veri bulunamadı'}</p>
        <Button asChild>
          <Link href="/flow-view">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Link>
        </Button>
      </div>
    );
  }

  const companyNode = nodes.find((n) => n.type === 'company');
  const companyName = (companyNode?.data.label as string) || 'Şirket';

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={companyName}
        description="İş Akışı Görünümü"
      />

      <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/flow-view">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Şirket listesine dön
          </span>
        </div>
        <div>
          {nodes.length} nesne • {edges.length} bağlantı
        </div>
      </div>

      <div className="h-[70vh] rounded-md border">
        <FlowContainer initialNodes={nodes} initialEdges={edges} />
      </div>
    </div>
  );
}

