'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Building2,
    Handshake,
    UserCircle,
    CheckCircle2,
    AlertCircle,
    Pencil,
    Check,
    X,
    CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { companyService } from '@/lib/firebase/companies';
import { contactService } from '@/lib/firebase/contacts';
import { dealService } from '@/lib/firebase/deals';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';
import type { FollowUpItem } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

export type FollowUpsPanelProps = {
    followUps: FollowUpItem[];
    loading: boolean;
};

function formatDate(timestamp: Timestamp | null): string {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
    });
}

function formatRelativeTime(timestamp: Timestamp | null): string {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return `${Math.floor(diffDays / 30)} ay önce`;
}

export function FollowUpsPanel({ followUps, loading }: FollowUpsPanelProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAction, setEditAction] = useState('');
    const [editDate, setEditDate] = useState<Date | undefined>(undefined);
    const [saving, setSaving] = useState(false);

    const handleItemClick = (item: FollowUpItem) => {
        if (editingId) return; // Don't navigate if editing
        if (item.type === 'company') {
            router.push(`/crm/companies/${item.id}`);
        } else if (item.type === 'contact') {
            router.push(`/crm/contacts`);
        } else {
            router.push(`/crm/deals/${item.id}`);
        }
    };

    const handleEditClick = (e: React.MouseEvent, item: FollowUpItem) => {
        e.stopPropagation();
        setEditingId(item.id);
        setEditAction(item.nextAction || '');
        setEditDate(item.nextActionDate?.toDate());
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditAction('');
        setEditDate(undefined);
    };

    const handleSaveEdit = async (e: React.MouseEvent, item: FollowUpItem) => {
        e.stopPropagation();
        if (!user) return;
        if (!editAction.trim() || !editDate) {
            toast.error('Aksiyon ve tarih zorunlu');
            return;
        }

        setSaving(true);
        try {
            if (item.type === 'company') {
                await companyService.updateNextAction(item.id, editAction, editDate, user.uid);
            } else if (item.type === 'contact') {
                await contactService.updateNextAction(item.id, editAction, editDate, user.uid);
            } else {
                await dealService.updateNextAction(item.id, editAction, editDate, user.uid);
            }
            toast.success('Aksiyon güncellendi');
            setEditingId(null);
            setEditAction('');
            setEditDate(undefined);
            // Refresh dashboard (parent component should handle this)
            window.location.reload();
        } catch (error) {
            console.error('Error updating next action:', error);
            toast.error('Aksiyon güncellenemedi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card className="col-span-2 row-span-2 h-full flex flex-col min-h-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-5 w-40" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const overdueCount = followUps.filter((f) => f.isOverdue).length;

    return (
        <Card className="col-span-1 h-full flex flex-col min-h-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                    Bugün &amp; Geciken

                </CardTitle>
                <CardAction>
                    {overdueCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {overdueCount}
                        </Badge>
                    )}
                </CardAction>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col px-4">
                {followUps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                        <p className="text-sm">Bekleyen takip yok</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {followUps.slice(0, 10).map((item) => {
                            const isEditing = editingId === item.id;
                            return (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className={`w-full p-3 rounded-lg border transition-colors ${isEditing ? 'border-primary bg-accent' :
                                        item.isOverdue
                                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                                            : 'hover:bg-accent cursor-pointer'
                                        }`}
                                    onClick={() => !isEditing && handleItemClick(item)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`p-2 rounded-full ${item.type === 'company'
                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                                : item.type === 'contact'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                                    : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                                                }`}
                                        >
                                            {item.type === 'company' ? (
                                                <Building2 className="h-4 w-4" />
                                            ) : item.type === 'contact' ? (
                                                <UserCircle className="h-4 w-4" />
                                            ) : (
                                                <Handshake className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm truncate">{item.title}</span>
                                                {item.isOverdue && !isEditing && (
                                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <div className="mt-1 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                        placeholder="Sonraki aksiyon..."
                                                        value={editAction}
                                                        onChange={(e) => setEditAction(e.target.value)}
                                                        className="text-sm"
                                                    />
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    'w-full justify-start text-left font-normal text-sm',
                                                                    !editDate && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-3 w-3" />
                                                                {editDate
                                                                    ? format(editDate, 'dd MMM yyyy', { locale: tr })
                                                                    : 'Tarih seç'}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={editDate}
                                                                onSelect={setEditDate}
                                                                locale={tr}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => handleSaveEdit(e, item)}
                                                            disabled={saving}
                                                            className="flex-1"
                                                        >
                                                            <Check className="mr-1 h-3 w-3" />
                                                            Kaydet
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={handleCancelEdit}
                                                            disabled={saving}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {item.nextAction && (
                                                        <p className="text-sm text-muted-foreground truncate mt-1">
                                                            {item.nextAction}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                        <span>
                                                            Tarih: {formatDate(item.nextActionDate)}
                                                        </span>
                                                        <span>
                                                            Son: {formatRelativeTime(item.lastActivityAt)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={item.isOverdue ? 'destructive' : 'secondary'}
                                                className="shrink-0"
                                            >
                                                {item.type === 'company' ? 'Company' : item.type === 'contact' ? 'Contact' : 'Deal'}
                                            </Badge>
                                            {!isEditing && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => handleEditClick(e, item)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
