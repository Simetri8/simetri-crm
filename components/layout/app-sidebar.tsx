import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator

} from "@/components/ui/sidebar"
import { Home, Building2, Users, Contact, KanbanSquare, FileText, Briefcase, Clock, Package } from "lucide-react"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { useAuth } from "@/components/auth/auth-provider"
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher"
import { useTheme } from "next-themes"

const mainItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
]

const crmItems = [
    {
        title: "Sirketler",
        url: "/crm/companies",
        icon: Building2,
    },
    {
        title: "Kisiler",
        url: "/crm/contacts",
        icon: Contact,
    },
    {
        title: "Pipeline",
        url: "/crm/pipeline",
        icon: KanbanSquare,
    },
    {
        title: "Katalog",
        url: "/crm/catalog",
        icon: Package,
    },
    {
        title: "Teklifler",
        url: "/crm/proposals",
        icon: FileText,
    },
]

const opsItems = [
    {
        title: "Is Emirleri",
        url: "/ops/work-orders",
        icon: Briefcase,
    },
    {
        title: "Zaman Girisi",
        url: "/time",
        icon: Clock,
    },
]

const settingsItems = [
    {
        title: "Kullanicilar",
        url: "/users",
        icon: Users,
    },
]

export function AppSidebar() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();

    const userData = {
        name: user?.displayName || user?.email?.split('@')[0] || "Kullanıcı",
        email: user?.email || "",
        avatar: user?.photoURL || "",
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <h1 className="text-xl p-2 font-bold">Simetri CRM</h1>
            </SidebarHeader>
            <SidebarContent>
                {/* Ana Menu */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="mx-0" />

                {/* CRM */}
                <SidebarGroup>
                    <SidebarGroupLabel>CRM</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {crmItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="mx-0" />

                {/* Operasyon */}
                <SidebarGroup>
                    <SidebarGroupLabel>Operasyon</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {opsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="mx-0" />

                {/* Ayarlar */}
                <SidebarGroup>
                    <SidebarGroupLabel>Ayarlar</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {settingsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="gap-4">
                <div className="px-4 py-2 flex items-center justify-between border-t border-border/50">
                    <span className="text-xs text-muted-foreground font-medium">Görünüm</span>
                    <ThemeSwitcher
                        value={theme as "light" | "dark" | "system"}
                        onChange={(t) => setTheme(t)}
                    />
                </div>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    )
}
