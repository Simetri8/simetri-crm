'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/lib/types';
import { taskService } from '@/lib/firebase/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { startOfWeek } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export function WeeklyPlanSummary() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        console.log('WeeklyPlanSummary: Loading tasks for week starting', weekStart);
        taskService.getWeeklyTasks(weekStart)
            .then((data) => {
                console.log(`WeeklyPlanSummary: Loaded ${data.length} tasks`);
                setTasks(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('WeeklyPlanSummary: Error loading tasks:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
        <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-primary" />
                        Haftalık Plan
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Bu hafta bitmesi gereken işler</p>
                </div>
                <Link href="/vision" className="text-xs text-muted-foreground hover:underline font-normal">
                    Detaylara Git
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span>İlerleme</span>
                            <span>%{Math.round(percentage)} ({completed}/{total})</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-xl font-bold">{total - completed}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Kalan İş</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-emerald-600">{completed}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Biten İş</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
