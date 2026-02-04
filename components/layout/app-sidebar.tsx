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
import { Home, Network, Building2, Users, Contact, KanbanSquare, FileText, Briefcase, Clock, Package, CheckSquare } from "lucide-react"
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
        title: "İş Akışı",
        url: "/flow-view",
        icon: Network,
    },
]

const crmItems = [
    {
        title: "Şirketler",
        url: "/crm/companies",
        icon: Building2,
    },
    {
        title: "Kişiler",
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
                <h1 className="text-xl p-2 font-bold">Simetri CRM</h1>
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
