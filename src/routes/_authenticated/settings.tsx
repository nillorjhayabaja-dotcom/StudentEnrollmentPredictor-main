import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sun, Moon, Monitor, User as UserIcon, Info, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Enroll.AI" }] }),
});

function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).single()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <h2 className="text-base font-semibold">Profile</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account information.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10" />
          </div>
          <Button onClick={save} disabled={busy} className="h-10">
            {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <h2 className="text-base font-semibold">Appearance</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Pick how Enroll.AI looks to you.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {([
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
          ] as const).map((opt) => {
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`group relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all ring-focus ${active ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/30"}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                  </span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-foreground" />}
                </div>
                <div className={`mt-1 flex h-14 w-full items-end gap-1 rounded-md border border-border p-2 ${opt.id === "dark" ? "bg-[oklch(0.13_0_0)]" : "bg-[oklch(0.99_0_0)]"}`}>
                  {[40, 60, 80].map((h) => (
                    <div key={h} className={`w-3 rounded-sm ${opt.id === "dark" ? "bg-white/70" : "bg-black/70"}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <h2 className="text-base font-semibold">About this app</h2>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <Row k="Stack" v="React · TanStack Start · Lovable Cloud" />
          <Row k="Forecasting" v="Holt-Winters seasonal smoothing" />
          <Row k="Charts" v="Recharts" />
          <Row k="Database" v="PostgreSQL with RLS" />
        </dl>
      </motion.div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border py-2 first:border-0 first:pt-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
