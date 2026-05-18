import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, TrendingUp, FileBarChart, Settings, GraduationCap, LogOut, Sparkles } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

const sections = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Students", url: "/students", icon: Users },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "Forecast", url: "/forecast", icon: TrendingUp, badge: "AI" },
      { title: "Reports", url: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const nav = useNavigate();
  const { signOut, user } = useAuth();
  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/30" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-foreground" />
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Enroll.AI</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Forecast Suite</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = path === item.url || path.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} className="group relative h-9 rounded-md">
                        <Link to={item.url} className="flex w-full items-center gap-2.5">
                          {active && !collapsed && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-foreground"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-sm">{item.title}</span>
                              {"badge" in item && item.badge && (
                                <span className="rounded-full border border-border bg-background px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {!collapsed && (
          <div className="mx-2 mt-4 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Pro Tip
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-sidebar-foreground/80">
              Filter the forecast by program to see semester-level predictions.
            </p>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-auto py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {initial}
              </div>
              {!collapsed && (
                <div className="ml-1 flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium">Admin</span>
                  <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await signOut();
                nav({ to: "/login" });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
