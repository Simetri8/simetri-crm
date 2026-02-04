'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchCompanyFlowData } from '@/lib/flow/data-fetcher';
import { FlowContainer } from '@/components/flow/flow-container';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Node, Edge } from '@xyflow/react';

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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">{error || 'Veri bulunamadı'}</p>
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/flow-view">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{companyName}</h1>
            <p className="text-sm text-muted-foreground">
              İş Akışı Görünümü
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {nodes.length} nesne • {edges.length} bağlantı
        </div>
      </div>

      {/* Flow Container */}
      <div className="flex-1">
        <FlowContainer initialNodes={nodes} initialEdges={edges} />
      </div>
    </div>
  );
}
