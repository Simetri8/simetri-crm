'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Building2,
  Calendar,
  Handshake,
  Loader2,
  UserCircle,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '@/lib/firebase/dashboard';
import { contactService } from '@/lib/firebase/contacts';
import { requestService } from '@/lib/firebase/requests';
import {
  CONTACT_STAGE_CONFIG,
  REQUEST_PRIORITY_CONFIG,
  REQUEST_STATUS_CONFIG,
  REQUEST_TYPE_LABELS,
} from '@/lib/utils/status';
import type { Contact, FollowUpItem, Request } from '@/lib/types';
import { ENTITY_COLORS } from '@/lib/constants/entity-colors';

const LIST_LIMIT = 50;

export type CrmDashboardListContext =
  | 'networking'
  | 'followups'
  | 'followupsOverdue'
  | 'followupsToday'
  | 'newContacts'
  | 'openRequests';

export type CrmDashboardEntityType = 'contact' | 'company' | 'deal' | 'request';

type CrmDashboardListSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: CrmDashboardListContext;
  refreshKey?: number;
  onSelectEntity: (entityType: CrmDashboardEntityType, id: string) => void;
};

type ListData = {
  followUps: FollowUpItem[];
  contacts: Contact[];
  requests: Request[];
};

function contextTitle(context: CrmDashboardListContext): string {
  switch (context) {
    case 'networking':
      return 'Networking Kişileri';
    case 'followups':
      return 'Bugün ve Geciken Takipler';
    case 'followupsOverdue':
      return 'Geciken Takipler';
    case 'followupsToday':
      return 'Bugün Yapılacaklar';
    case 'newContacts':
      return 'Yeni Kişiler';
    case 'openRequests':
      return 'Açık Talepler';
    default:
      return 'Kayıtlar';
  }
}

function formatDateValue(date: Date): string {
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  return hasTime
    ? format(date, 'dd MMM yyyy HH:mm', { locale: tr })
    : format(date, 'dd MMM yyyy', { locale: tr });
}

export function CrmDashboardListSheet({
  open,
  onOpenChange,
  context,
  refreshKey,
  onSelectEntity,
}: CrmDashboardListSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListData>({ followUps: [], contacts: [], requests: [] });

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (context === 'followups' || context === 'followupsOverdue' || context === 'followupsToday') {
          const followUps = await dashboardService.getFollowUps({ limitCount: LIST_LIMIT });
          const filtered =
            context === 'followupsOverdue'
              ? followUps.filter((item) => item.isOverdue)
              : context === 'followupsToday'
                ? followUps.filter((item) => !item.isOverdue)
                : followUps;
          setData({ followUps: filtered, contacts: [], requests: [] });
          return;
        }

        if (context === 'networking') {
          const networking = await contactService.getRecentNew({ limitCount: LIST_LIMIT });
          const contacts = networking.filter((contact) => contact.stage === 'networking');
          setData({ followUps: [], contacts, requests: [] });
          return;
        }

        if (context === 'newContacts') {
          const contacts = await contactService.getRecentNew({ limitCount: LIST_LIMIT });
          setData({ followUps: [], contacts, requests: [] });
          return;
        }

        const requests = await requestService.getOpen({ limitCount: LIST_LIMIT });
        setData({ followUps: [], contacts: [], requests });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kayıtlar yüklenemedi';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [open, context, refreshKey]);

  const title = useMemo(() => contextTitle(context), [context]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[520px] w-[min(520px,95vw)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md border">
              <Loader2 className="h-4 w-4 animate-spin" />
              Kayıtlar yükleniyor...
            </div>
          )}

          {!loading && error && (
            <div className="p-3 rounded-md border border-destructive/40 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && context.startsWith('followups') && (
            <div className="space-y-2">
              {data.followUps.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground rounded-md border">Kayıt bulunamadı.</div>
              ) : (
                data.followUps.map((item) => (
                  <Button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    variant="ghost"
                    className="w-full h-auto p-3 justify-start border rounded-md"
                    onClick={() => onSelectEntity(item.type, item.id)}
                  >
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.type === 'company' ? (
                          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : item.type === 'deal' ? (
                          <Handshake className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <UserCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {item.nextActionDate && (
                            <p className="text-xs text-muted-foreground">
                              {formatDateValue(item.nextActionDate.toDate())}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={item.isOverdue ? 'destructive' : 'secondary'}>
                        {ENTITY_COLORS[item.type].label}
                      </Badge>
                    </div>
                  </Button>
                ))
              )}
            </div>
          )}

          {!loading && !error && (context === 'networking' || context === 'newContacts') && (
            <div className="space-y-2">
              {data.contacts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground rounded-md border">Kayıt bulunamadı.</div>
              ) : (
                data.contacts.map((contact) => (
                  <Button
                    key={contact.id}
                    type="button"
                    variant="ghost"
                    className="w-full h-auto p-3 justify-start border rounded-md"
                    onClick={() => onSelectEntity('contact', contact.id)}
                  >
                    <div className="flex items-start justify-between w-full gap-3">
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{contact.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.companyName || 'Şirket yok'}
                        </p>
                        {contact.nextActionDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateValue(contact.nextActionDate.toDate())}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={contact.stage ? `${CONTACT_STAGE_CONFIG[contact.stage].bgColor} ${CONTACT_STAGE_CONFIG[contact.stage].color}` : ''}
                      >
                        {CONTACT_STAGE_CONFIG[contact.stage].label}
                      </Badge>
                    </div>
                  </Button>
                ))
              )}
            </div>
          )}

          {!loading && !error && context === 'openRequests' && (
            <div className="space-y-2">
              {data.requests.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground rounded-md border">Kayıt bulunamadı.</div>
              ) : (
                data.requests.map((request) => (
                  <Button
                    key={request.id}
                    type="button"
                    variant="ghost"
                    className="w-full h-auto p-3 justify-start border rounded-md"
                    onClick={() => onSelectEntity('request', request.id)}
                  >
                    <div className="flex items-start justify-between w-full gap-3">
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{request.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {REQUEST_TYPE_LABELS[request.type]}
                          {request.companyName ? ` · ${request.companyName}` : ''}
                        </p>
                        {request.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateValue(request.dueDate.toDate())}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="secondary"
                          className={`${REQUEST_PRIORITY_CONFIG[request.priority].bgColor} ${REQUEST_PRIORITY_CONFIG[request.priority].color}`}
                        >
                          {REQUEST_PRIORITY_CONFIG[request.priority].label}
                        </Badge>
                        <Badge variant="outline" className={REQUEST_STATUS_CONFIG[request.status].color}>
                          {REQUEST_STATUS_CONFIG[request.status].label}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          )}

          <div className="pt-2">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
