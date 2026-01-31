'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, Task } from '@/lib/types';
import { projectService } from '@/lib/firebase/projects';
import { TaskList } from '@/components/tasks/task-list';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Edit, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/utils/status';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectService.getById(projectId);
      if (!data) {
        router.push('/projects');
        return;
      }
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskDialogOpen(true);
  };

  const handleTaskSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleProjectSuccess = () => {
    loadProject();
  };

  if (loading) {
    return <div>Yukleniyor...</div>;
  }

  if (!project) {
    return <div>Proje bulunamadi.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
            <Badge className={PROJECT_STATUS_COLORS[project.status]}>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setProjectDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Duzenle
        </Button>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.customerName && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Musteri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{project.customerName}</p>
            </CardContent>
          </Card>
        )}

        {project.targetStartDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Baslangic Tarihi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {format(project.targetStartDate.toDate(), 'd MMMM yyyy', { locale: tr })}
              </p>
            </CardContent>
          </Card>
        )}

        {project.targetEndDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Hedef Bitis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {format(project.targetEndDate.toDate(), 'd MMMM yyyy', { locale: tr })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Backlog */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Backlog</h3>
            <p className="text-sm text-muted-foreground">
              Gorevleri surukleyerek siralayabilirsiniz.
            </p>
          </div>
          <Button onClick={handleAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Gorev Ekle
          </Button>
        </div>

        <TaskList
          projectId={projectId}
          onEdit={handleEditTask}
          refreshKey={refreshKey}
        />
      </div>

      {/* Task Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={selectedTask}
        projectId={projectId}
        projectName={project.name}
        onSuccess={handleTaskSuccess}
      />

      {/* Project Edit Dialog */}
      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={project}
        onSuccess={handleProjectSuccess}
      />
    </div>
  );
}
