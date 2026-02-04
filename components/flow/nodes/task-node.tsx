'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_STATUS_CONFIG, BLOCKED_REASON_LABELS } from '@/lib/utils/status';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';

export const TaskNode = memo(({ data, targetPosition }: NodeProps<any>) => {
  const task = data.metadata as Task;
  const statusConfig = TASK_STATUS_CONFIG[task.status];

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 shadow-sm',
        'bg-white',
        'hover:shadow-md transition-shadow cursor-pointer',
        'min-w-[220px]'
      )}
    >
      <Handle
        type="target"
        position={targetPosition ?? Position.Top}
        className="!bg-gray-400 !border-gray-500"
      />

      <div className="flex items-center gap-2 mb-1">
        <CheckSquare className="h-4 w-4 text-gray-600" />
        <span className="font-medium text-xs truncate">
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

        {task.status === 'blocked' && task.blockedReason && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="mr-1 h-3 w-3" />
            {BLOCKED_REASON_LABELS[task.blockedReason]}
          </Badge>
        )}
      </div>

      {task.assigneeName && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {task.assigneeName}
        </p>
      )}

      <div className="mt-2 pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-400 font-mono">tasks</span>
      </div>
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
