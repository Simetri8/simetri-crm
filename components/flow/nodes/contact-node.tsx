'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@/lib/types';

export const ContactNode = memo(({ data }: any) => {
  const contact = data.metadata as Contact;

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 shadow-md',
        'bg-gradient-to-br from-teal-50 to-cyan-50',
        'border-teal-300',
        'hover:shadow-lg transition-shadow cursor-pointer',
        'min-w-[200px]'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-teal-400 !border-teal-500"
      />

      <div className="flex items-center gap-2 mb-1">
        <User className="h-4 w-4 text-teal-600" />
        <span className="font-medium text-teal-900 text-xs">
          {data.label}
        </span>
      </div>

      {contact.isPrimary && (
        <Badge variant="secondary" className="text-xs">
          Birincil
        </Badge>
      )}
      {data.subtitle && (
        <p className="text-xs text-teal-600 mt-1 truncate">{data.subtitle}</p>
      )}

      <div className="mt-2 pt-2 border-t border-teal-200">
        <span className="text-xs text-teal-400 font-mono">contacts</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-teal-400 !border-teal-500"
      />
    </div>
  );
});

ContactNode.displayName = 'ContactNode';
