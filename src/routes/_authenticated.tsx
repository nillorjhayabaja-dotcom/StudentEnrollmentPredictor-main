import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const DEMO_EMAIL = "demo@example.com";

function AuthLayout() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/students": "Students",
    "/forecast": "Forecast",
    "/reports": "Reports",
    "/settings": "Settings",
  };
  const title = Object.entries(titleMap).find(([k]) => path.startsWith(k))?.[1] ?? "Workspace";


  // Demo mode: allow entering authenticated routes without requiring a Supabase user.
  // Data access is controlled by Supabase RLS policies.

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
            <span className="absolute inset-0 animate-ping rounded-xl border border-foreground/20" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    );
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <main className="flex-1 p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={path}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
