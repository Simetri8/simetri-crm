import { ProjectColumn } from '@/components/dashboard/project-column';
import { CustomerColumn } from '@/components/dashboard/customer-column';
import { ActivityColumn } from '@/components/dashboard/activity-column';
import { SmartNudges } from '@/components/dashboard/smart-nudges';
import { WeeklyPlanSummary } from '@/components/dashboard/weekly-plan';

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Simetri Planner projenize hoş geldiniz. İşte genel durum:
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WeeklyPlanSummary />
                <SmartNudges />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProjectColumn />
                <CustomerColumn />
                <ActivityColumn />
            </div>
        </div>
    );
}
