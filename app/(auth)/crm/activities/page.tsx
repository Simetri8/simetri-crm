'use client';

import { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityFeed } from '@/components/crm/activity-feed';
import { activityService } from '@/lib/firebase/activities';
import type { Activity } from '@/lib/types';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getRecent(100);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Aktiviteler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Aktiviteler"
        description="Tüm CRM ve operasyon aktivitelerinin akışı"
      />

      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={loadActivities}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <ActivityFeed
              activities={activities}
              showContext
              emptyMessage="Henüz aktivite yok"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
