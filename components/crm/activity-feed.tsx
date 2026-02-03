'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import {
  Phone,
  Users,
  Mail,
  FileText,
  PenLine,
  CheckSquare,
  Settings,
  Building2,
  Briefcase,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/utils/status';
import type { Activity, ActivityType } from '@/lib/types';

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  note: PenLine,
  file: FileText,
  decision: CheckSquare,
  system: Settings,
};

type ActivityFeedProps = {
  activities: Activity[];
  showContext?: boolean; // Şirket/Deal linklerini goster
  emptyMessage?: string;
};

export function ActivityFeed({
  activities,
  showContext = true,
  emptyMessage = 'Henuz aktivite yok',
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = ACTIVITY_TYPE_CONFIG[activity.type];
        const Icon = ACTIVITY_ICONS[activity.type];
        const occurredAt = activity.occurredAt?.toDate();

        return (
          <div
            key={activity.id}
            className="flex gap-3 p-3 rounded-lg border bg-card"
          >
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                config.bgColor
              )}
            >
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      config.bgColor,
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                  {/* Context Links */}
                  {showContext && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {activity.companyName && (
                        <Link
                          href={`/crm/companies/${activity.companyId}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Building2 className="h-3 w-3" />
                          {activity.companyName}
                        </Link>
                      )}
                      {activity.dealTitle && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          <Link
                            href={`/crm/deals/${activity.dealId}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Briefcase className="h-3 w-3" />
                            {activity.dealTitle}
                          </Link>
                        </>
                      )}
                      {activity.workOrderTitle && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          <Link
                            href={`/ops/work-orders/${activity.workOrderId}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Briefcase className="h-3 w-3" />
                            {activity.workOrderTitle}
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {occurredAt && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(occurredAt, { addSuffix: true, locale: tr })}
                  </span>
                )}
              </div>

              {/* Summary */}
              <p className="mt-2 text-sm">{activity.summary}</p>

              {/* Details */}
              {activity.details && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {activity.details}
                </p>
              )}

              {/* Next Action */}
              {activity.nextAction && (
                <div className="mt-2 flex items-center gap-2 text-xs bg-amber-50 text-amber-700 rounded px-2 py-1">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">Sonraki:</span>
                  <span>{activity.nextAction}</span>
                  {activity.nextActionDate && (
                    <span className="text-amber-600">
                      ({format(activity.nextActionDate.toDate(), 'dd MMM', { locale: tr })})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
