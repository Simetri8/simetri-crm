'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Briefcase, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const navCards = [
    {
        title: 'CRM Dashboard',
        description: 'Takipler, pipeline, networking ve talepler',
        href: '/dashboard/crm',
        icon: BarChart3,
    },
    {
        title: 'Operasyon Dashboard',
        description: 'İş emirleri ve zaman yönetimi',
        href: '/dashboard/ops',
        icon: Briefcase,
    },
];

export function DashboardNavCards() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {navCards.map((card) => (
                <Link key={card.href} href={card.href}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <card.icon className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">{card.title}</CardTitle>
                            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
