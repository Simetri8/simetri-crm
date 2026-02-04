'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMPANY_STATUS_CONFIG } from '@/lib/utils/status';
import type { Company } from '@/lib/types';

export const CompanyNode = memo(({ data, sourcePosition }: NodeProps<any>) => {
  const company = data.metadata as Company;
  const statusConfig = COMPANY_STATUS_CONFIG[company.status];

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg',
        'bg-gradient-to-br from-slate-50 to-blue-50',
        'border-slate-300',
        'hover:shadow-xl transition-shadow cursor-pointer',
        'min-w-[280px]'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-5 w-5 text-slate-600" />
        <span className="font-semibold text-slate-900 text-sm">
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

      <div className="mt-2 pt-2 border-t border-slate-200">
        <span className="text-xs text-slate-400 font-mono">companies</span>
      </div>

      <Handle
        type="source"
        position={sourcePosition ?? Position.Bottom}
        className="!bg-slate-400 !border-slate-500"
      />
    </div>
  );
});

CompanyNode.displayName = 'CompanyNode';
