'use client';

import { useEffect, useState } from 'react';
import { customerService } from '@/lib/firebase/customers';
import { projectService } from '@/lib/firebase/projects';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, X } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Nudge {
    id: string;
    type: 'customer' | 'project';
    message: string;
    severity: 'high' | 'medium';
}

export function SmartNudges() {
    const [nudges, setNudges] = useState<Nudge[]>([]);
    const [dismissed, setDismissed] = useState<string[]>([]);

    useEffect(() => {
        async function checkNudges() {
            try {
                console.log('SmartNudges: Checking for nudges...');
                const [customers, projects] = await Promise.all([
                    customerService.getAll(),
                    projectService.getAll()
                ]);
                console.log(`SmartNudges: Fetched ${customers.length} customers and ${projects.length} projects`);

                const newNudges: Nudge[] = [];
                const now = new Date();

                // Müşteri dürtmeleri
                customers.forEach(c => {
                    if (c.lastContactDate) {
                        const days = differenceInDays(now, c.lastContactDate.toDate());
                        if (days > 30) {
                            newNudges.push({
                                id: `c-${c.id}`,
                                type: 'customer',
                                message: `${c.name} ile 30 gündür iletişim kurulmadı.`,
                                severity: 'high'
                            });
                        } else if (days > 14) {
                            newNudges.push({
                                id: `c-${c.id}`,
                                type: 'customer',
                                message: `${c.name} ile iletişimi tazelemek iyi olabilir.`,
                                severity: 'medium'
                            });
                        }
                    }
                });

                // Proje dürtmeleri
                projects.filter(p => p.status === 'active').forEach(p => {
                    if (p.targetEndDate) {
                        const days = differenceInDays(p.targetEndDate.toDate(), now);
                        if (days < 0) {
                            newNudges.push({
                                id: `p-${p.id}`,
                                type: 'project',
                                message: `${p.name} projesinin hedef tarihi geçti!`,
                                severity: 'high'
                            });
                        } else if (days < 7) {
                            newNudges.push({
                                id: `p-${p.id}`,
                                type: 'project',
                                message: `${p.name} projesinin bitmesine 1 haftadan az kaldı.`,
                                severity: 'medium'
                            });
                        }
                    }
                });

                setNudges(newNudges.slice(0, 3)); // Max 3 dürtme gösterelim
                console.log(`SmartNudges: Calculated ${newNudges.length} active nudges`);
            } catch (error) {
                console.error('SmartNudges: Error checking nudges:', error);
            }
        }

        checkNudges();
    }, []);

    const handleDismiss = (id: string) => {
        setDismissed(prev => [...prev, id]);
    };

    const activeNudges = nudges.filter(n => !dismissed.includes(n.id));

    if (activeNudges.length === 0) return null;

    return (
        <div className="space-y-2">
            {activeNudges.map((nudge) => (
                <Card key={nudge.id} className={cn(
                    "border-l-4",
                    nudge.severity === 'high' ? "border-l-red-500" : "border-l-amber-500"
                )}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {nudge.severity === 'high' ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                                <Clock className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-sm font-medium">{nudge.message}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDismiss(nudge.id)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
