'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/lib/types';
import { projectService } from '@/lib/firebase/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/utils/status';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export function ProjectColumn() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('ProjectColumn: Loading projects...');
        projectService.getAll()
            .then((data) => {
                console.log(`ProjectColumn: Loaded ${data.length} projects`);
                setProjects(data.filter(p => p.status === 'active').slice(0, 10));
                setLoading(false);
            })
            .catch(err => {
                console.error('ProjectColumn: Error loading projects:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    Projeler
                    <Link href="/projects" className="text-xs text-muted-foreground hover:underline font-normal">
                        Tümünü Gör
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[400px]">
                    <div className="px-2 space-y-3">
                        {projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Aktif proje bulunamadı.</p>
                        ) : (
                            projects.map((project) => (
                                <Link key={project.id} href={`/projects/${project.id}`}>
                                    <div className="flex flex-col gap-1 p-3 rounded-md border bg-card hover:bg-accent transition-colors mb-3 last:mb-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-sm truncate max-w-[260px]">{project.name}</span>
                                            <Badge className={PROJECT_STATUS_COLORS[project.status]} variant="secondary" style={{ fontSize: '10px' }}>
                                                {PROJECT_STATUS_LABELS[project.status]}
                                            </Badge>
                                        </div>
                                        {project.customerName && (
                                            <span className="text-xs text-muted-foreground truncate">{project.customerName}</span>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
