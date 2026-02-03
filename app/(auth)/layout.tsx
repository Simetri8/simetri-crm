'use client';

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { QuickActionButton } from "@/components/layout/quick-action-button"
import { Toaster } from "@/components/ui/sonner"
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher"
import { useTheme } from "next-themes"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

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
            <main className="relative min-h-screen flex-1 min-w-0 overflow-x-hidden">
                <div className="p-4 md:p-6 lg:p-8">
                    <div className="mb-4 flex items-center justify-between">
                        <SidebarTrigger />
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2">
                                <ThemeSwitcher
                                    value={theme as "light" | "dark" | "system"}
                                    onChange={(t) => setTheme(t)}
                                />
                            </div>
                            <div className="md:hidden">
                                <ThemeSwitcher
                                    value={theme as "light" | "dark" | "system"}
                                    onChange={(t) => setTheme(t)}
                                />
                            </div>
                        </div>
                    </div>
                    {children}
                </div>
                <QuickActionButton />
                <Toaster />
            </main>
        </SidebarProvider>
    )
}
