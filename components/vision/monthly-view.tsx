'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Target, Flag, ArrowRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Goal } from '@/lib/types';
import { goalService } from '@/lib/firebase/goals';
import { GoalFormDialog } from './goal-form-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function MonthlyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedGoals = await goalService.getMonthlyGoals(
        currentDate.getMonth(),
        currentDate.getFullYear()
      );
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error loading monthly goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'project_start': return <ArrowRight className="h-4 w-4 text-emerald-500" />;
      case 'project_end': return <Flag className="h-4 w-4 text-red-500" />;
      case 'milestone': return <Target className="h-4 w-4 text-blue-500" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <Button variant="outline" size="icon" onClick={prevMonth}>&lt;</Button>
        <div className="flex flex-col items-center">
          <h3 className="font-semibold text-lg">
            {format(currentDate, 'MMMM yyyy', { locale: tr })}
          </h3>
          <span className="text-xs text-muted-foreground">Aylık Hedefler</span>
        </div>
        <Button variant="outline" size="icon" onClick={nextMonth}>&gt;</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg font-medium">Hedefler ve Kilometre Taşları</CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Hedef Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Bu ay için henüz bir hedef belirlenmemiş.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map(goal => (
                <div key={goal.id} className="flex flex-col p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-full bg-slate-100">
                      {getGoalIcon(goal.goalType)}
                    </div>
                    <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                      {goal.status === 'planned' ? 'Planlandı' : 
                       goal.status === 'in_progress' ? 'Sürüyor' : 
                       goal.status === 'completed' ? 'Tamamlandı' : 'Ertelendi'}
                    </Badge>
                  </div>
                  <h4 className="font-semibold mb-1">{goal.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{goal.description}</p>
                  <div className="mt-auto flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(goal.targetDate.toDate(), 'd MMM yyyy', { locale: tr })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <GoalFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        type="monthly"
        month={currentDate.getMonth()}
        year={currentDate.getFullYear()}
        onSuccess={loadData}
      />
    </div>
  );
}
