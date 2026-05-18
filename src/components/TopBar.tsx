import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Search, Sun, Moon, ChevronDown, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

export function TopBar({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [unread] = useState(3);
  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl no-print">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <SidebarTrigger className="ring-focus" />
        <div className="hidden h-4 w-px bg-border sm:block" />
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="hidden truncate text-sm font-medium sm:block"
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students, programs…"
              className="h-8 w-64 rounded-md pl-8 text-xs"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-block">
              ⌘ K
            </kbd>
          </div>

          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle} className="relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                    {unread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] font-normal text-muted-foreground">{unread} new</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { t: "Forecast updated", d: "Next semester +4.2%", time: "2m ago" },
                { t: "New enrollment batch", d: "12 records imported", time: "1h ago" },
                { t: "Weekly report ready", d: "Download from Reports", time: "Yesterday" },
              ].map((n, i) => (
                <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 py-2">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-medium">{n.t}</span>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{n.d}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border bg-card px-1 py-1 pr-2 text-xs transition-colors hover:bg-muted ring-focus">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initial}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{user?.email}</span>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <SettingsIcon className="h-3.5 w-3.5" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
