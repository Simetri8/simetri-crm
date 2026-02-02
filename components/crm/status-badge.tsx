'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StatusConfig } from '@/lib/types';

type StatusBadgeProps = {
  config: StatusConfig;
  className?: string;
};

export function StatusBadge({ config, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(config.bgColor, config.color, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}
