'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Building2, User, Calendar, BadgeDollarSign } from 'lucide-react';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  type DragEndEvent,
} from '@/components/kibo-ui/kanban';
import { StatusBadge } from './status-badge';
import { DEAL_STAGE_CONFIG, DEAL_STAGE_ORDER, formatMoney } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { Deal, DealStage } from '@/lib/types';

type KanbanDeal = Deal & {
  name: string;
  column: string;
};

type DealPipelineProps = {
  deals: Deal[];
  onStageChange: (dealId: string, newStage: DealStage) => Promise<void>;
};

export function DealPipeline({ deals, onStageChange }: DealPipelineProps) {
  // Kanban formatina cevir
  const [kanbanData, setKanbanData] = useState<KanbanDeal[]>(() =>
    deals.map((deal) => ({
      ...deal,
      name: deal.title,
      column: deal.stage,
    }))
  );

  // Pipeline icin sadece aktif stage'ler
  const activeStages = DEAL_STAGE_ORDER.filter(
    (stage) => stage !== 'won' && stage !== 'lost'
  );

  const columns = activeStages.map((stage) => ({
    id: stage,
    name: DEAL_STAGE_CONFIG[stage].label,
    color: DEAL_STAGE_CONFIG[stage].color,
    bgColor: DEAL_STAGE_CONFIG[stage].bgColor,
  }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const deal = kanbanData.find((d) => d.id === active.id);
    if (!deal) return;

    const newStage = over.id as DealStage;
    if (deal.stage !== newStage) {
      await onStageChange(deal.id, newStage);
    }
  };

  return (
    <KanbanProvider
      columns={columns}
      data={kanbanData}
      onDataChange={setKanbanData}
      onDragEnd={handleDragEnd}
    >
      {(column) => (
        <KanbanBoard id={column.id} key={column.id}>
          <KanbanHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full',
                  column.bgColor
                )}
              />
              <span>{column.name}</span>
            </div>
            <span className="text-muted-foreground text-xs">
              {kanbanData.filter((d) => d.column === column.id).length}
            </span>
          </KanbanHeader>
          <KanbanCards<KanbanDeal> id={column.id}>
            {(deal) => (
              <KanbanCard key={deal.id} id={deal.id} name={deal.title} column={deal.column}>
                <Link
                  href={`/crm/deals/${deal.id}`}
                  className="block hover:bg-accent/50 transition-colors -m-3 p-3 rounded-md"
                >
                  <div className="space-y-2">
                    <p className="font-medium text-sm line-clamp-2">{deal.title}</p>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{deal.companyName}</span>
                    </div>

                    {deal.estimatedBudgetMinor && (
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <BadgeDollarSign className="h-3 w-3" />
                        <span>{formatMoney(deal.estimatedBudgetMinor, deal.currency)}</span>
                      </div>
                    )}

                    {deal.nextAction && (
                      <div
                        className={cn(
                          'text-xs p-1.5 rounded',
                          deal.nextActionDate &&
                            deal.nextActionDate.toDate() < new Date()
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {deal.nextAction}
                        {deal.nextActionDate && (
                          <span className="ml-1 opacity-75">
                            ({format(deal.nextActionDate.toDate(), 'dd MMM', { locale: tr })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}
