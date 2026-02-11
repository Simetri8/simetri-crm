'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityFeed } from '@/components/crm/activity-feed';
import { ActivitySquare, ArrowRight } from 'lucide-react';
import type { Activity } from '@/lib/types';

type RecentActivitiesPanelProps = {
  activities: Activity[];
  loading: boolean;
};

export function RecentActivitiesPanel({
  activities,
  loading,
}: RecentActivitiesPanelProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ActivitySquare className="h-4 w-4" />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="mb-2 h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ActivitySquare className="h-4 w-4" />
          Son Aktiviteler
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => router.push('/crm/activities')}
        >
          Tümünü Gör
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <ActivityFeed
          activities={activities}
          showContext
          emptyMessage="Henüz aktivite yok"
        />
      </CardContent>
    </Card>
  );
}
