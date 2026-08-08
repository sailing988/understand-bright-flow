import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in | NeuroLearn" },
      { name: "description", content: "Sign in to your personalized NeuroLearn workspace." },
      { property: "og:title", content: "Sign in | NeuroLearn" },
      { property: "og:description", content: "Sign in to your personalized NeuroLearn workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: { next?: string }) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : "",
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const goNext = () => {
    if (next) window.location.href = next;
    else nav({ to: "/app" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        return toast.error("Wrong email or password — or this email was never finished signing up. Try creating the account again.");
      }
      return toast.error(error.message);
    }
    toast.success("Welcome back!");
    goNext();
  };


  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back to NeuroLearn.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="p">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              const redirect = next ? `${window.location.origin}${next}` : `${window.location.origin}/app`;
              const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirect });
              if (result.error) toast.error(result.error.message || "Google sign-in failed");
            }}
          >
            Continue with Google
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
