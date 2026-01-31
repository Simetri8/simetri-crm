'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/lib/types';
import { taskService } from '@/lib/firebase/tasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
} from '@/lib/utils/status';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface TaskListProps {
  projectId: string;
  onEdit: (task: Task) => void;
  refreshKey?: number;
}

interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: Task) => void;
}

function SortableTaskItem({ task, onEdit, onDelete, onToggleComplete }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-white border rounded-lg',
        isDragging && 'opacity-50 shadow-lg',
        task.status === 'done' && 'opacity-60'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Checkbox
        checked={task.status === 'done'}
        onCheckedChange={() => onToggleComplete(task)}
      />

      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', task.status === 'done' && 'line-through')}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge className={TASK_PRIORITY_COLORS[task.priority]} variant="secondary">
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
        <Badge className={TASK_STATUS_COLORS[task.status]}>
          {TASK_STATUS_LABELS[task.status]}
        </Badge>
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {format(task.dueDate.toDate(), 'd MMM', { locale: tr })}
          </span>
        )}
      </div>

      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700"
          onClick={() => task.id && onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TaskList({ projectId, onEdit, refreshKey }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTasks();
  }, [projectId, refreshKey]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getByProject(projectId);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu gorevi silmek istediginizden emin misiniz?')) {
      await taskService.delete(id);
      loadTasks();
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!task.id) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await taskService.update(task.id, { status: newStatus });
    loadTasks();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      // Update order in database
      const updates = newTasks.map((task, index) => ({
        id: task.id!,
        order: index,
      }));
      await taskService.reorder(updates);
    }
  };

  if (loading) {
    return <div>Yukleniyor...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Henuz gorev eklenmemis.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map((t) => t.id || '')} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={handleDelete}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
