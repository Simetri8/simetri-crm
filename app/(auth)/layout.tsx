'use client';

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { QuickActionButton } from "@/components/layout/quick-action-button"
import { Toaster } from "@/components/ui/sonner"
import { AppHeader, AppHeaderProvider } from "@/components/layout/app-header"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Yükleniyor...</div>;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <AppHeaderProvider>
                <main className="relative min-h-screen flex-1 min-w-0 overflow-x-hidden">
                    <div className="p-4 lg:p-6">
                        <AppHeader />
                        {children}
                    </div>
                    <QuickActionButton />
                    <Toaster />
                </main>
            </AppHeaderProvider>
        </SidebarProvider>
    )
}
