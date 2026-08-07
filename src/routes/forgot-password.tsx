import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password | NeuroLearn" },
      { name: "description", content: "Request a secure NeuroLearn password reset link." },
      { property: "og:title", content: "Reset password | NeuroLearn" },
      { property: "og:description", content: "Request a secure NeuroLearn password reset link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          {sent ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.</p>
              <Button asChild variant="outline" className="w-full"><Link to="/login" search={{ next: "" }}>Back to sign in</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
              <Button asChild variant="ghost" className="w-full"><Link to="/login" search={{ next: "" }}>Back to sign in</Link></Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}