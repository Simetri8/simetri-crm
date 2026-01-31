import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem

} from "@/components/ui/sidebar"
import { Home, Folder, Users, MessageSquare, Flag } from "lucide-react"
import Link from "next/link"

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Projeler",
        url: "/projects",
        icon: Folder,
    },
    {
        title: "Musteriler",
        url: "/customers",
        icon: Users,
    },
    {
        title: "Iletisim",
        url: "/communications",
        icon: MessageSquare,
    },
    {
        title: "Vizyon",
        url: "/vision",
        icon: Flag,
    },
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <h1 className="text-xl p-2 font-bold">Planner</h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
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
        </Sidebar>
    )
}
