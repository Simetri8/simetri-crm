'use client';

import { useEffect, useState } from 'react';
import { Project } from '@/lib/types';
import { projectService } from '@/lib/firebase/projects';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/utils/status';
import Link from 'next/link';

interface ProjectListProps {
  onEdit: (project: Project) => void;
  refreshKey?: number;
  statusFilter?: Project['status'] | 'all';
}

export function ProjectList({ onEdit, refreshKey, statusFilter = 'all' }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [refreshKey, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      let data: Project[];
      if (statusFilter === 'all') {
        data = await projectService.getAll();
      } else {
        data = await projectService.getByStatus(statusFilter);
      }
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu projeyi silmek istediginizden emin misiniz?')) {
      await projectService.delete(id);
      loadProjects();
    }
  };

  if (loading) {
    return <div>Yukleniyor...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proje Adi</TableHead>
            <TableHead>Musteri</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Hedef Bitis</TableHead>
            <TableHead>Son Guncelleme</TableHead>
            <TableHead className="text-right">Islemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10">
                Hic proje bulunamadi.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.customerName || '-'}</TableCell>
                <TableCell>
                  <Badge className={PROJECT_STATUS_COLORS[project.status]}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.targetEndDate
                    ? format(project.targetEndDate.toDate(), 'd MMM yyyy', { locale: tr })
                    : '-'}
                </TableCell>
                <TableCell>
                  {project.updatedAt
                    ? format(project.updatedAt.toDate(), 'd MMM yyyy', { locale: tr })
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link href={`/projects/${project.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => project.id && handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
