import { ProjectStatus, TaskStatus, TaskPriority } from '@/lib/types';

// Project Status
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Aktif',
  pending: 'Beklemede',
  completed: 'Tamamlandi',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  active: 'bg-emerald-500 text-white hover:bg-emerald-600',
  pending: 'bg-amber-500 text-white hover:bg-amber-600',
  completed: 'bg-slate-400 text-white hover:bg-slate-500',
};

// Task Status
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Yapilacak',
  in_progress: 'Devam Ediyor',
  done: 'Tamamlandi',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-slate-500 text-white hover:bg-slate-600',
  in_progress: 'bg-blue-500 text-white hover:bg-blue-600',
  done: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

// Task Priority
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Dusuk',
  normal: 'Normal',
  high: 'Yuksek',
  urgent: 'Acil',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-300 text-slate-700 hover:bg-slate-400',
  normal: 'bg-slate-500 text-white hover:bg-slate-600',
  high: 'bg-amber-500 text-white hover:bg-amber-600',
  urgent: 'bg-red-500 text-white hover:bg-red-600',
};
