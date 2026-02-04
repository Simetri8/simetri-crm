'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DELIVERABLE_STATUS_CONFIG } from '@/lib/utils/status';
import type { Deliverable } from '@/lib/types';

export const DeliverableNode = memo(
  ({ data, targetPosition, sourcePosition }: NodeProps<any>) => {
  const deliverable = data.metadata as Deliverable;
  const statusConfig = DELIVERABLE_STATUS_CONFIG[deliverable.status];

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 shadow-md',
        'bg-white',
        'hover:shadow-lg transition-shadow cursor-pointer',
        'min-w-[240px]'
      )}
    >
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        className="!bg-indigo-400 !border-indigo-500"
      />

      <div className="flex items-center gap-2 mb-1">
        <Package className="h-4 w-4 text-indigo-600" />
        <span className="font-medium text-sm truncate">
          {data.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
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

      <div className="mt-2 pt-2 border-t border-indigo-200">
        <span className="text-xs text-indigo-400 font-mono">deliverables</span>
      </div>

      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        className="!bg-indigo-400 !border-indigo-500"
      />
    </div>
  );
  }
);

DeliverableNode.displayName = 'DeliverableNode';
