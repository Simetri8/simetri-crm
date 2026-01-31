'use client';

import { useState } from 'react';
import { ProjectList } from '@/components/projects/project-list';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { Project, ProjectStatus } from '@/lib/types';

export default function ProjectsPage() {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setOpen(true);
  };

  const handleAdd = () => {
    setSelectedProject(null);
    setOpen(true);
  };

  const onSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projeler</h2>
          <p className="text-muted-foreground">
            Proje listesi ve yonetimi buradan yapilir.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Proje
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="all">Tumu</TabsTrigger>
          <TabsTrigger value="active">Aktif</TabsTrigger>
          <TabsTrigger value="pending">Beklemede</TabsTrigger>
          <TabsTrigger value="completed">Tamamlandi</TabsTrigger>
        </TabsList>
      </Tabs>

      <ProjectList
        onEdit={handleEdit}
        refreshKey={refreshKey}
        statusFilter={statusFilter}
      />

      <ProjectFormDialog
        open={open}
        onOpenChange={setOpen}
        project={selectedProject}
        onSuccess={onSuccess}
      />
    </div>
  );
}
