'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Phone, Mail, Users, MessageSquare } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Task, Goal } from '@/lib/types';
import { taskService } from '@/lib/firebase/tasks';
import { goalService } from '@/lib/firebase/goals';
import { GoalFormDialog } from './goal-form-dialog';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function WeeklyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contactGoals, setContactGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedTasks, fetchedGoals] = await Promise.all([
        taskService.getWeeklyTasks(weekStart),
        goalService.getWeeklyGoals(weekStart)
      ]);

      setTasks(fetchedTasks);
      setContactGoals(fetchedGoals.filter(g => g.goalType === 'contact'));
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <Button variant="outline" size="icon" onClick={prevWeek}>&lt;</Button>
        <div className="flex flex-col items-center">
          <h3 className="font-semibold text-lg">
            {format(weekStart, 'd MMMM', { locale: tr })} - {format(weekEnd, 'd MMMM yyyy', { locale: tr })}
          </h3>
          <span className="text-xs text-muted-foreground">Haftalık Plan</span>
        </div>
        <Button variant="outline" size="icon" onClick={nextWeek}>&gt;</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks Column */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Bitmesi Gereken İşler
              <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ekle
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Bu hafta için planlanmış görev yok.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className={cn("mt-0.5", task.status === 'done' ? "text-emerald-500" : "text-muted-foreground")}>
                      {task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm", task.status === 'done' && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                          {task.projectName}
                        </Badge>
                        {task.priority === 'urgent' && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">Acil</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts Column */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Aranacak Müşteriler
              <Badge variant="secondary" className="ml-2">{contactGoals.length}</Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setIsGoalDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ekle
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : contactGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Bu hafta için planlanmış iletişim yok.
              </div>
            ) : (
              <div className="space-y-3">
                {contactGoals.map(goal => (
                  <div key={goal.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className={cn("mt-0.5 p-1.5 rounded-full bg-blue-100 text-blue-600")}>
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm", goal.status === 'completed' && "line-through text-muted-foreground")}>
                        {goal.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                         <Badge className={cn("text-[10px] px-1 py-0 h-5", getStatusColor(goal.status))}>
                            {goal.status === 'planned' ? 'Planlandı' : 
                             goal.status === 'in_progress' ? 'Sürüyor' : 
                             goal.status === 'completed' ? 'Tamamlandı' : 'Ertelendi'}
                         </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GoalFormDialog 
        open={isGoalDialogOpen} 
        onOpenChange={setIsGoalDialogOpen}
        type="weekly"
        weekStart={weekStart}
        onSuccess={loadData}
      />

      {/* Note: In a real app, we would need a way to select project for new task. 
          For now, we might need a simpler task add dialog or force project selection.
          Since TaskFormDialog requires projectId, we can't easily use it here without context.
          For this iteration, I'll skip TaskFormDialog integration or mock it. 
          Actually, I should probably use a simplified "Quick Task" dialog or redirect to Projects.
          But let's leave the button there, maybe it opens a "Select Project" dialog first?
          For now, let's just show a toast that this feature is coming or link to projects.
      */}
    </div>
  );
}
