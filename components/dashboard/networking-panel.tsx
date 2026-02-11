'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowRight,
    Handshake,
    Building2,
    UserCircle,
    Calendar,
} from 'lucide-react';
import type { NetworkingItem } from '@/lib/types';
import { CONTACT_STAGE_CONFIG, CONTACT_SOURCE_LABELS } from '@/lib/utils/status';
import { cn } from '@/lib/utils';

export type NetworkingPanelProps = {
    contacts: NetworkingItem[];
    loading: boolean;
};

function formatDateWithOptionalTime(date: Date): string {
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    return hasTime
        ? format(date, 'dd MMM HH:mm', { locale: tr })
        : format(date, 'dd MMM', { locale: tr });
}

export function NetworkingPanel({
    contacts,
    loading,
}: NetworkingPanelProps) {
    const router = useRouter();

    if (loading) {
        return (
            <Card className="col-span-1 row-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-5 w-32" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-3 rounded-lg border">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 row-span-1 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Handshake className="h-4 w-4" />
                    Networking
                </CardTitle>
                <CardAction>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/crm/contacts')}
                        className="gap-1 text-xs"
                    >
                        Tümünü Gör
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="px-4 flex flex-col gap-3">
                {contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Handshake className="h-8 w-8 mb-2 text-green-500" />
                        <p className="text-sm">Yeni networking kişisi yok</p>
                    </div>
                ) : (
                    contacts.slice(0, 10).map((contact) => {
                        const stageConfig = CONTACT_STAGE_CONFIG[contact.stage];

                        return (
                            <button
                                key={contact.id}
                                onClick={() => router.push('/crm/contacts')}
                                className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <p className="font-medium text-sm truncate">
                                                {contact.fullName}
                                            </p>
                                        </div>
                                        {contact.companyName && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 ml-5">
                                                <Building2 className="h-3 w-3" />
                                                {contact.companyName}
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className={cn('shrink-0 text-xs', stageConfig.bgColor, stageConfig.color)}
                                    >
                                        {stageConfig.label}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                    {contact.source && (
                                        <span>{CONTACT_SOURCE_LABELS[contact.source]}</span>
                                    )}
                                    {contact.nextAction && (
                                        <span className="truncate max-w-[120px]">
                                            {contact.nextAction}
                                        </span>
                                    )}
                                    {contact.nextActionDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDateWithOptionalTime(contact.nextActionDate.toDate())}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
