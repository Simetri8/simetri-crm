'use client';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  CheckSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/crm/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TASK_STATUSES } from '@/lib/types';
import { TASK_STATUS_CONFIG, BLOCKED_REASON_LABELS } from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';

type TaskListProps = {
  tasks: Task[];
  onAdd?: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, status: TaskStatus) => void;
  onToggleDone?: (task: Task) => void;
  compact?: boolean;
};

export function TaskList({
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleDone,
  compact = false,
}: TaskListProps) {
  if (tasks.length === 0 && !onAdd) {
    return (
      <p className="text-xs text-muted-foreground py-2">Gorev yok</p>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.length === 0 ? (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-muted-foreground">Gorev yok</p>
          {onAdd && (
            <Button variant="ghost" size="sm" onClick={onAdd} className="h-6 text-xs">
              <Plus className="mr-1 h-3 w-3" />
              Ekle
            </Button>
          )}
        </div>
      ) : (
        <>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50',
                task.status === 'done' && 'opacity-60',
                task.status === 'blocked' && 'bg-red-50'
              )}
            >
              {/* Checkbox for quick toggle */}
              {onToggleDone && (
                <Checkbox
                  checked={task.status === 'done'}
                  onCheckedChange={() => onToggleDone(task)}
                  className="h-4 w-4"
                />
              )}

              {!onToggleDone && (
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              )}

              {/* Task Title */}
              <span
                className={cn(
                  'flex-1 text-sm',
                  task.status === 'done' && 'line-through'
                )}
              >
                {task.title}
              </span>

              {/* Blocked Reason */}
              {task.status === 'blocked' && task.blockedReason && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {BLOCKED_REASON_LABELS[task.blockedReason]}
                </Badge>
              )}

              {/* Assignee */}
              {task.assigneeName && !compact && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.assigneeName}
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && !compact && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(task.dueDate.toDate(), 'dd MMM', { locale: tr })}
                </div>
              )}

              {/* Status Selector or Badge */}
              {onStatusChange && !compact ? (
                <Select
                  value={task.status}
                  onValueChange={(v) => onStatusChange(task, v as TaskStatus)}
                >
                  <SelectTrigger className="w-[120px] h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {TASK_STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : !compact ? (
                <StatusBadge
                  config={TASK_STATUS_CONFIG[task.status]}
                  className="text-xs"
                />
              ) : null}

              {/* Actions */}
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Duzenle
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(task)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}

          {/* Add button at bottom */}
          {onAdd && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdd}
              className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="mr-1 h-3 w-3" />
              Gorev Ekle
            </Button>
          )}
        </>
      )}
    </div>
  );
}
