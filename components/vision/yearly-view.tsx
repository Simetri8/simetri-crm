'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Trophy, TrendingUp } from 'lucide-react';
import { format, addYears, subYears } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Goal } from '@/lib/types';
import { goalService } from '@/lib/firebase/goals';
import { GoalFormDialog } from './goal-form-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function YearlyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedGoals = await goalService.getYearlyGoals(
        currentDate.getFullYear()
      );
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error loading yearly goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const nextYear = () => setCurrentDate(addYears(currentDate, 1));
  const prevYear = () => setCurrentDate(subYears(currentDate, 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <Button variant="outline" size="icon" onClick={prevYear}>&lt;</Button>
        <div className="flex flex-col items-center">
          <h3 className="font-semibold text-lg">
            {format(currentDate, 'yyyy', { locale: tr })}
          </h3>
          <span className="text-xs text-muted-foreground">Yıllık Hedefler</span>
        </div>
        <Button variant="outline" size="icon" onClick={nextYear}>&gt;</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg font-medium">Büyük Hedefler</CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Hedef Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Bu yıl için henüz bir hedef belirlenmemiş.
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(goal => (
                <div key={goal.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-lg">{goal.title}</h4>
                      <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                        {goal.status === 'planned' ? 'Planlandı' : 
                         goal.status === 'in_progress' ? 'Sürüyor' : 
                         goal.status === 'completed' ? 'Tamamlandı' : 'Ertelendi'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{goal.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Hedef: {format(goal.targetDate.toDate(), 'd MMMM yyyy', { locale: tr })}
                    </div>
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
        type="yearly"
        year={currentDate.getFullYear()}
        onSuccess={loadData}
      />
    </div>
  );
}
