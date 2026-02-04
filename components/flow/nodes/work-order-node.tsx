'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORK_ORDER_STATUS_CONFIG } from '@/lib/utils/status';
import type { WorkOrder } from '@/lib/types';

export const WorkOrderNode = memo(
  ({ data, targetPosition, sourcePosition }: NodeProps<any>) => {
  const workOrder = data.metadata as WorkOrder;
  const statusConfig = WORK_ORDER_STATUS_CONFIG[workOrder.status];

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg',
        'bg-gradient-to-br from-amber-50 to-orange-50',
        'border-amber-300',
        'hover:shadow-xl transition-shadow cursor-pointer',
        'min-w-[280px]'
      )}
    >
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        className="!bg-amber-400 !border-amber-500"
      />

      <div className="flex items-center gap-2 mb-2">
        <Briefcase className="h-5 w-5 text-amber-600" />
        <span className="font-semibold text-amber-900 text-sm truncate">
          {data.label}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            statusConfig.bgColor,
            statusConfig.color
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {data.subtitle && (
        <p className="text-xs text-amber-700 mt-1 truncate">{data.subtitle}</p>
      )}

      <div className="mt-2 pt-2 border-t border-amber-200">
        <span className="text-xs text-amber-500 font-mono">work_orders</span>
      </div>

      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        className="!bg-amber-400 !border-amber-500"
      />
    </div>
  );
  }
);

WorkOrderNode.displayName = 'WorkOrderNode';
