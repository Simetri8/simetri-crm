'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Package,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/crm/status-badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DELIVERABLE_STATUSES } from '@/lib/types';
import { DELIVERABLE_STATUS_CONFIG } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { Deliverable, DeliverableStatus, Task } from '@/lib/types';

type DeliverableWithTasks = Deliverable & {
  tasks?: Task[];
};

type DeliverableListProps = {
  deliverables: DeliverableWithTasks[];
  onAdd?: () => void;
  onEdit?: (deliverable: Deliverable) => void;
  onDelete?: (deliverable: Deliverable) => void;
  onStatusChange?: (deliverable: Deliverable, status: DeliverableStatus) => void;
  onAddTask?: (deliverable: Deliverable) => void;
  renderTasks?: (deliverable: Deliverable) => React.ReactNode;
};

export function DeliverableList({
  deliverables,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  onAddTask,
  renderTasks,
}: DeliverableListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Teslimatlar</h3>
        {onAdd && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Teslimat Ekle
          </Button>
        )}
      </div>

      {deliverables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
          <Package className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Henuz teslimat yok</p>
          {onAdd && (
            <Button variant="link" size="sm" onClick={onAdd}>
              Ilk teslimati ekle
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {deliverables.map((deliverable) => {
            const isExpanded = expandedIds.has(deliverable.id);
            const taskCount = deliverable.tasks?.length ?? 0;

            return (
              <Collapsible
                key={deliverable.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(deliverable.id)}
              >
                <div className="border rounded-lg">
                  {/* Deliverable Header */}
                  <div className="flex items-center gap-2 p-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium flex-1">{deliverable.title}</span>

                    {taskCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {taskCount} gorev
                      </Badge>
                    )}

                    {deliverable.targetDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(deliverable.targetDate.toDate(), 'dd MMM', {
                          locale: tr,
                        })}
                      </div>
                    )}

                    {onStatusChange ? (
                      <Select
                        value={deliverable.status}
                        onValueChange={(v) =>
                          onStatusChange(deliverable, v as DeliverableStatus)
                        }
                      >
                        <SelectTrigger className="w-[140px] h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERABLE_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {DELIVERABLE_STATUS_CONFIG[status].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <StatusBadge
                        config={DELIVERABLE_STATUS_CONFIG[deliverable.status]}
                      />
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onAddTask && (
                          <DropdownMenuItem onClick={() => onAddTask(deliverable)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Gorev Ekle
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(deliverable)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Duzenle
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(deliverable)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Deliverable Notes */}
                  {deliverable.notes && (
                    <div className="px-3 pb-2 pl-11">
                      <p className="text-xs text-muted-foreground">
                        {deliverable.notes}
                      </p>
                    </div>
                  )}

                  {/* Tasks */}
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 p-3 pl-11">
                      {renderTasks ? (
                        renderTasks(deliverable)
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Gorev yok
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
