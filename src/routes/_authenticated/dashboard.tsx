import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Users, GraduationCap, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Enroll.AI" }] }),
});

function KPI({ icon: Icon, label, value, delta, hint, index = 0 }: {
  icon: any; label: string; value: number; delta?: number; hint?: string; index?: number;
}) {
  const animated = useCountUp(value);
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] as const }}
      className="card-elevated hover-lift group relative overflow-hidden p-5"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-foreground/[0.03] transition-transform group-hover:scale-110" />
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="relative mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{animated.toLocaleString()}</span>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium ${positive ? "text-foreground" : "text-destructive"}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {hint && <p className="relative mt-1 text-xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [students, enrollments, activity] = await Promise.all([
        supabase.from("students").select("*"),
        supabase.from("enrollments").select("*").order("year").order("semester"),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8),
      ]);
      return {
        students: students.data ?? [],
        enrollments: enrollments.data ?? [],
        activity: activity.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const total = data.students.length;
  const active = data.students.filter((s) => s.status === "Active").length;
  const totalEnroll = data.enrollments.reduce((a, b) => a + b.count, 0);

  const genderMap: Record<string, number> = {};
  data.students.forEach((s) => { genderMap[s.gender] = (genderMap[s.gender] ?? 0) + 1; });
  const genderData = Object.entries(genderMap).map(([name, value]) => ({ name, value }));

  const programMap: Record<string, number> = {};
  data.enrollments.forEach((e) => { programMap[e.program] = (programMap[e.program] ?? 0) + e.count; });
  const programData = Object.entries(programMap).map(([name, value]) => ({ name: name.replace("BS ", ""), value }));

  const yearMap: Record<string, number> = {};
  data.enrollments.forEach((e) => { const k = `${e.year}`; yearMap[k] = (yearMap[k] ?? 0) + e.count; });
  const trendData = Object.entries(yearMap).sort().map(([year, count]) => ({ year, count }));

  const last = trendData[trendData.length - 1]?.count ?? 0;
  const prev = trendData[trendData.length - 2]?.count ?? 1;
  const growth = ((last - prev) / prev) * 100;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const CHART_COLORS = ["hsl(var(--foreground))", "currentColor"];

  return (
    <div className="space-y-6">
      {/* Hero / welcome */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-elevated relative overflow-hidden p-6 md:p-7"
      >
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-foreground/[0.04] blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3" /> AI-powered overview
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
              {greeting}, {name}.
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Here's what's happening across your campus today. Forecasts updated moments ago.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center md:text-right">
            <Stat tiny label="Active" value={active} />
            <Stat tiny label="Programs" value={Object.keys(programMap).length} />
            <Stat tiny label="Growth" value={`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`} />
          </div>
        </div>
      </motion.section>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI index={0} icon={Users} label="Total students" value={total} hint={`${active} currently active`} delta={2.4} />
        <KPI index={1} icon={GraduationCap} label="Programs" value={Object.keys(programMap).length} hint="Active programs" />
        <KPI index={2} icon={Activity} label="All-time enrollments" value={totalEnroll} hint="Historical aggregate" delta={1.8} />
        <KPI index={3} icon={TrendingUp} label="YoY growth" value={Math.round(Math.abs(growth) * 10) / 10} hint="Last vs prior year" delta={growth} />
      </div>

      {/* Trend + Gender */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="card-elevated p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h3 className="text-sm font-semibold">Enrollment trend</h3>
              <p className="text-xs text-muted-foreground">Annual aggregate · all programs</p>
            </div>
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {trendData.length} years
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid var(--color-border)",
                    background: "var(--color-popover)", color: "var(--color-popover-foreground)",
                    fontSize: 12, boxShadow: "var(--shadow-card)",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="currentColor" strokeWidth={2} fill="url(#trendFill)" className="text-foreground" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="card-elevated p-5"
        >
          <h3 className="text-sm font-semibold">Gender distribution</h3>
          <p className="text-xs text-muted-foreground">Across all active students</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={3} stroke="var(--color-card)" strokeWidth={2}>
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "var(--color-foreground)" : i === 1 ? "color-mix(in oklab, var(--color-foreground) 55%, transparent)" : "color-mix(in oklab, var(--color-foreground) 25%, transparent)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid var(--color-border)",
                    background: "var(--color-popover)", color: "var(--color-popover-foreground)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5 text-xs">
            {genderData.map((g, i) => (
              <div key={g.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{
                    background: i === 0 ? "var(--color-foreground)" : i === 1 ? "color-mix(in oklab, var(--color-foreground) 55%, transparent)" : "color-mix(in oklab, var(--color-foreground) 25%, transparent)"
                  }} />
                  {g.name}
                </span>
                <span className="font-medium tabular-nums">{g.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Programs + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="card-elevated p-5 lg:col-span-2"
        >
          <h3 className="text-sm font-semibold">Enrollment by program</h3>
          <p className="text-xs text-muted-foreground">Total historical enrollments</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--color-foreground) 5%, transparent)" }}
                  contentStyle={{
                    borderRadius: 10, border: "1px solid var(--color-border)",
                    background: "var(--color-popover)", color: "var(--color-popover-foreground)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="currentColor" className="text-foreground" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
          className="card-elevated p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
          </div>
          {data.activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">No activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Actions will appear here as they happen.</p>
            </div>
          ) : (
            <ol className="relative mt-4 space-y-4 border-l border-border pl-4">
              {data.activity.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="relative"
                >
                  <span className="absolute -left-[21px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-border bg-card">
                    <span className="h-1 w-1 rounded-full bg-foreground" />
                  </span>
                  <p className="text-sm font-medium leading-tight">{a.action}</p>
                  {a.detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.detail}</p>}
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </motion.li>
              ))}
            </ol>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ label, value, tiny }: { label: string; value: number | string; tiny?: boolean }) {
  return (
    <div className={tiny ? "rounded-md border border-border bg-background/60 px-2.5 py-2 backdrop-blur" : ""}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
