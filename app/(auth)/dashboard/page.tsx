'use client';

import { ProjectColumn } from '@/components/dashboard/project-column';
import { CustomerColumn } from '@/components/dashboard/customer-column';
import { ActivityColumn } from '@/components/dashboard/activity-column';
import { SmartNudges } from '@/components/dashboard/smart-nudges';
import { DevSeedButton } from '@/components/dashboard/dev-seed-button';
import { MiniCalendar, MiniCalendarDay, MiniCalendarDays, MiniCalendarNavigation } from '@/components/kibo-ui/mini-calendar';
import { Ticker, TickerIcon, TickerSymbol } from '@/components/kibo-ui/ticker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, TrendingUp } from 'lucide-react';

export default function DashboardPage() {

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground text-sm mt-1">Hoş geldiniz, işte bugünkü özetiniz.</p>
                </div>
                <DevSeedButton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 overflow-hidden border-none shadow-md bg-linear-to-br from-primary/5 to-background">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <ListTodo className="h-5 w-5 text-primary" />
                            Haftalık Plan & Takvim
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MiniCalendar value={new Date()} days={7} className="border-none bg-transparent p-0">
                            <MiniCalendarNavigation direction="prev" />
                            <MiniCalendarDays className="flex-1 justify-between">
                                {(date) => <MiniCalendarDay key={date.toISOString()} date={date} />}
                            </MiniCalendarDays>
                            <MiniCalendarNavigation direction="next" />
                        </MiniCalendar>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Hızlı Bakış
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Ticker currency="TRY" locale="tr-TR" className="w-full justify-between p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                            <div className="flex items-center gap-3">
                                <TickerIcon symbol="PR" />
                                <TickerSymbol symbol="Projeler" />
                            </div>
                            <span className="font-bold text-lg">12 Aktif</span>
                        </Ticker>
                        <Ticker currency="TRY" locale="tr-TR" className="w-full justify-between p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                            <div className="flex items-center gap-3">
                                <TickerIcon symbol="MS" />
                                <TickerSymbol symbol="Müşteriler" />
                            </div>
                            <span className="font-bold text-lg">45 Kayıtlı</span>
                        </Ticker>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SmartNudges />
                <ActivityColumn />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <ProjectColumn />
                <CustomerColumn />
            </div>
        </div>
    );
}
