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
import { Home, Network, Building2, Users, Contact, KanbanSquare, FileText, Briefcase, Clock, Package, CheckSquare, ClipboardList, BarChart3, CalendarDays } from "lucide-react"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { useAuth } from "@/components/auth/auth-provider"

const mainItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "CRM Dashboard",
        url: "/dashboard/crm",
        icon: BarChart3,
    },
    {
        title: "Ops Dashboard",
        url: "/dashboard/ops",
        icon: Briefcase,
    },
    {
        title: "İş Akışı",
        url: "/flow-view",
        icon: Network,
    },
    {
        title: "Takvim",
        url: "/calendar",
        icon: CalendarDays,
    },
]

const crmItems = [
    {
        title: "Pipeline",
        url: "/crm/pipeline",
        icon: KanbanSquare,
    },
    {
        title: "Kişiler",
        url: "/crm/contacts",
        icon: Contact,
    },
    {
        title: "Şirketler",
        url: "/crm/companies",
        icon: Building2,
    },
    {
        title: "Talepler",
        url: "/crm/requests",
        icon: ClipboardList,
    },
    {
        title: "Teklifler",
        url: "/crm/proposals",
        icon: FileText,
    }
]

const opsItems = [
    {
        title: "İş Emirleri",
        url: "/ops/work-orders",
        icon: Briefcase,
    },
    {
        title: "Zaman Girişi",
        url: "/time",
        icon: Clock,
    },
    {
        title: "Timesheet Onayları",
        url: "/time/approve",
        icon: CheckSquare,
    },
]

const settingsItems = [
    {
        title: "Ürün Kataloğu",
        url: "/crm/catalog",
        icon: Package,
    },
    {
        title: "Kullanıcılar",
        url: "/users",
        icon: Users,
    },
]

export function AppSidebar() {
    const { user } = useAuth();

    const userData = {
        name: user?.displayName || user?.email?.split('@')[0] || "Kullanıcı",
        email: user?.email || "",
        avatar: user?.photoURL || "",
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <Link href="/dashboard" className="flex items-center p-2">
                    <img
                        src="/logos/Simetri-CRM-logo-02-cropped.png"
                        alt="Simetri CRM"
                        className="h-8 w-auto dark:hidden"
                    />
                    <img
                        src="/logos/Simetri-CRM-logo-03-cropped.png"
                        alt="Simetri CRM"
                        className="hidden h-8 w-auto dark:block"
                    />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                {/* Ana Menü */}
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
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    )
}
