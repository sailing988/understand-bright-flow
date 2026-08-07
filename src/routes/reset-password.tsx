import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | NeuroLearn" },
      { name: "description", content: "Choose a new password for your NeuroLearn account." },
      { property: "og:title", content: "Choose a new password | NeuroLearn" },
      { property: "og:description", content: "Choose a new password for your NeuroLearn account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const hasRecoveryHash = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";

    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(hasRecoveryHash || Boolean(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === "PASSWORD_RECOVERY" && session) setReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated. You can now sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { next: "" } });
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold">Choose a new password</h1>
          {!ready ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">This reset link is invalid or has expired. Request a new one to continue.</p>
              <Button asChild className="w-full"><Link to="/forgot-password">Request a new link</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              <div><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}