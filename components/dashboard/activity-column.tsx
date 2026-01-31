'use client';

import { useEffect, useState } from 'react';
import { Communication, Task } from '@/lib/types';
import { communicationService } from '@/lib/firebase/communications';
import { taskService } from '@/lib/firebase/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CheckCircle2, MessageSquare, Phone, Mail, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ActivityItem =
    | { type: 'communication'; data: Communication; timestamp: Date }
    | { type: 'task'; data: Task; timestamp: Date };

export function ActivityColumn() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadActivities() {
            try {
                console.log('ActivityColumn: Loading activities (comms + tasks)...');
                const [comms, tasks] = await Promise.all([
                    communicationService.getRecent(10),
                    taskService.getRecentlyCompleted(10)
                ]);

                console.log(`ActivityColumn: Found ${comms.length} comms and ${tasks.length} tasks`);

                const combined: ActivityItem[] = [
                    ...comms.map(c => ({
                        type: 'communication' as const,
                        data: c,
                        timestamp: c.date.toDate()
                    })),
                    ...tasks.map(t => ({
                        type: 'task' as const,
                        data: t,
                        timestamp: t.completedAt?.toDate() || t.updatedAt.toDate()
                    }))
                ];

                setActivities(combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15));
            } catch (error) {
                console.error('ActivityColumn: Error loading activities:', error);
            } finally {
                setLoading(false);
            }
        }

        loadActivities();
    }, []);

    const getCommIcon = (type: string) => {
        switch (type) {
            case 'phone': return <Phone className="h-3 w-3" />;
            case 'email': return <Mail className="h-3 w-3" />;
            case 'meeting': return <Users className="h-3 w-3" />;
            default: return <MessageSquare className="h-3 w-3" />;
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    Son İşlemler
                    <Link href="/communications" className="text-xs text-muted-foreground hover:underline font-normal">
                        Tümünü Gör
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-4">
                        {activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Henüz işlem bulunamadı.</p>
                        ) : (
                            activities.map((item, index) => (
                                <div key={index} className="flex gap-3 relative pb-4 last:pb-0">
                                    {index !== activities.length - 1 && (
                                        <div className="absolute left-[11px] top-[24px] bottom-0 w-[2px] bg-muted/50" />
                                    )}
                                    <div className={cn(
                                        "mt-1 p-1 rounded-full shrink-0",
                                        item.type === 'task' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                    )}>
                                        {item.type === 'task' ? <CheckCircle2 className="h-4 w-4" /> : getCommIcon(item.data.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-none mb-1 truncate">
                                            {item.type === 'task' ? item.data.title : item.data.customerName}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {item.type === 'task'
                                                ? `${item.data.projectName} projesinde bir görev tamamlandı.`
                                                : item.data.summary}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(item.timestamp, 'd MMM HH:mm', { locale: tr })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
