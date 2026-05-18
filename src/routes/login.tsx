import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { GraduationCap, Loader2, ArrowLeft, Sparkles, ShieldCheck, Brain } from "lucide-react";
import { motion } from "framer-motion";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "Demo123456";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Enroll.AI" }] }),
});

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        // Demo-only pre-check (prevents wrong credentials from even attempting Supabase login)
        if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
          toast.error("Invalid demo credentials");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Supabase signInWithPassword error:", error);
          const desc = (error as any)?.error_description || (error as any)?.message || "Authentication failed";
          toast.error("Authentication failed", { description: desc });
          return;
        }

        // Extra safety: ensure the signed-in user is the demo user.
        const sessionEmail = await supabase.auth
          .getSession()
          .then((r) => r.data.session?.user.email)
          .catch(() => undefined);

        if (sessionEmail !== DEMO_EMAIL) {
          await supabase.auth.signOut();
          toast.error("Access denied for this account");
          return;
        }

        toast.success("Welcome back");
      } else {
        // Keep demo access restricted: disable signup for non-demo users.
        toast.error("Signup is disabled in this demo. Use the demo account to log in.");
        return;
      }

      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }} />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-primary-foreground/5 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2 text-primary-foreground/90 transition hover:text-primary-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-foreground text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Enroll.AI</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative max-w-md"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/15 bg-primary-foreground/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">
            <Sparkles className="h-3 w-3" /> Forecast Suite
          </div>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight">
            Forecasting next semester's enrollment used to take days. Now it's a glance.
          </h2>
          <p className="mt-4 text-sm text-primary-foreground/65">
            — Registrar's Office, Demo School
          </p>

          <div className="mt-10 space-y-3 text-sm">
            {[
              { i: Brain, t: "Seasonal AI forecasts every semester" },
              { i: ShieldCheck, t: "Bank-grade auth with row-level security" },
            ].map((f, idx) => (
              <motion.div
                key={f.t}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + idx * 0.1 }}
                className="flex items-center gap-2.5 text-primary-foreground/80"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-primary-foreground/15 bg-primary-foreground/[0.04]">
                  <f.i className="h-3.5 w-3.5" />
                </span>
                {f.t}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative flex items-center justify-between text-xs text-primary-foreground/55">
          <span>© Enroll.AI · Portfolio Demo</span>
          <span>v1.0</span>
        </div>
      </div>

      {/* Right form */}
      <div className="relative flex items-center justify-center bg-background p-6">
        <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Enroll.AI</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Sign in to your account" : "Create an account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin" ? "Enter your email to continue to the dashboard." : "Start managing enrollment in under a minute."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="h-10" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@school.edu" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
            {mode === "signin" && (
                  <span className="text-[11px] text-muted-foreground">Min 6 chars</span>
                )}
              </div>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-10" />
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 w-full"
                disabled={busy}
                onClick={() => {
                  setMode("signin");
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                  void (async () => {
                    // Trigger the same flow as submit
                    const res = await (async () => {
                      setBusy(true);
                      try {
                        if (DEMO_EMAIL !== DEMO_EMAIL || DEMO_PASSWORD !== DEMO_PASSWORD) {
                          toast.error("Invalid demo credentials");
                          return;
                        }
                        const { error } = await supabase.auth.signInWithPassword({
                          email: DEMO_EMAIL,
                          password: DEMO_PASSWORD,
                        });
                        if (error) {
                          toast.error(error.message ?? "Authentication failed");
                          return;
                        }

                        const sessionEmail = await supabase.auth
                          .getSession()
                          .then((r) => r.data.session?.user.email)
                          .catch(() => undefined);

                        if (sessionEmail !== DEMO_EMAIL) {
                          await supabase.auth.signOut();
                          toast.error("Access denied for this account");
                          return;
                        }

                        toast.success("Welcome back");
                        nav({ to: "/dashboard" });
                      } catch (e: any) {
                        toast.error(e.message ?? "Authentication failed");
                      } finally {
                        setBusy(false);
                      }
                    })();
                    return res;
                  })();
                }}
              >
                Login as Demo
              </Button>

              <Button type="submit" className="h-10 w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "New here?" : "Have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
