'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEAL_STAGE_CONFIG } from '@/lib/utils/status';
import type { Deal } from '@/lib/types';

export const DealNode = memo(
  ({ data, targetPosition, sourcePosition }: NodeProps<any>) => {
  const deal = data.metadata as Deal;
  const stageConfig = DEAL_STAGE_CONFIG[deal.stage];

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg',
        'bg-white',
        'hover:shadow-xl transition-shadow cursor-pointer',
        'min-w-[260px]'
      )}
      style={{
        borderColor: stageConfig.color.replace('text-', ''),
      }}
    >
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        className="!bg-blue-400 !border-blue-500"
      />

      <div className="flex items-center gap-2 mb-2">
        <Handshake className="h-4 w-4" style={{ color: stageConfig.color.replace('text-', '') }} />
        <span className="font-semibold text-sm truncate">
          {data.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            stageConfig.bgColor,
            stageConfig.color
          )}
        >
          {stageConfig.label}
        </span>
      </div>

      {data.subtitle && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{data.subtitle}</p>
      )}

      <div className="mt-2 pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-400 font-mono">deals</span>
      </div>

      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        className="!bg-blue-400 !border-blue-500"
      />
    </div>
  );
  }
);

DealNode.displayName = 'DealNode';
