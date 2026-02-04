'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROPOSAL_STATUS_CONFIG } from '@/lib/utils/status';
import type { Proposal } from '@/lib/types';

export const ProposalNode = memo(
  ({ data, targetPosition, sourcePosition }: NodeProps<any>) => {
  const proposal = data.metadata as Proposal;
  const statusConfig = PROPOSAL_STATUS_CONFIG[proposal.status];

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
        className="!bg-purple-400 !border-purple-500"
      />

      <div className="flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4 text-purple-600" />
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

      {data.subtitle && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{data.subtitle}</p>
      )}

      <div className="mt-2 pt-2 border-t border-purple-200">
        <span className="text-xs text-purple-400 font-mono">proposals</span>
      </div>

      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        className="!bg-purple-400 !border-purple-500"
      />
    </div>
  );
  }
);

ProposalNode.displayName = 'ProposalNode';
