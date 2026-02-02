import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator

} from "@/components/ui/sidebar"
import { Home, Folder, Users, MessageSquare, Flag } from "lucide-react"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { useAuth } from "@/components/auth/auth-provider"
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher"
import { useTheme } from "next-themes"

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        type: "divider",
    },
    {
        title: "Kullanıcılar",
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
                <h1 className="text-xl p-2 font-bold">Planner</h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item, index) => item.type === "divider" ? (
                                <SidebarSeparator key={index} />
                            ) : (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url || ""}>
                                            {item.icon && <item.icon />}
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
