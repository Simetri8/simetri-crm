'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyView } from '@/components/vision/weekly-view';
import { MonthlyView } from '@/components/vision/monthly-view';
import { YearlyView } from '@/components/vision/yearly-view';

export default function VisionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vizyon ve Hedefler</h2>
        <p className="text-muted-foreground">
          Şirketin kısa, orta ve uzun vadeli hedeflerini buradan yönetebilirsiniz.
        </p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Haftalık Plan</TabsTrigger>
          <TabsTrigger value="monthly">Aylık Hedefler</TabsTrigger>
          <TabsTrigger value="yearly">Yıllık Vizyon</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="space-y-4">
          <WeeklyView />
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-4">
          <MonthlyView />
        </TabsContent>
        
        <TabsContent value="yearly" className="space-y-4">
          <YearlyView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
