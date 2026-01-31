'use client';

import * as React from 'react';
import { Plus, Briefcase, UserPlus, MessageSquarePlus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function QuickActionButton() {
    const router = useRouter();

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90">
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mb-2">
                    <DropdownMenuItem onClick={() => router.push('/projects/new')}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Yeni Proje</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/customers/new')}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Yeni Müşteri</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/communications/new')}>
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        <span>Görüşme Kaydet</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
