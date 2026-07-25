import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, LogOut } from "lucide-react";

export function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Brain className="h-5 w-5 text-primary" />
            <span>NeuroLearn</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/" className="rounded-md px-3 py-1.5 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted font-medium" }}>Home</Link>
            {user && (
              <>
                <Link to="/app" className="rounded-md px-3 py-1.5 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted font-medium" }}>Workspace</Link>
                <Link to="/planner" className="rounded-md px-3 py-1.5 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted font-medium" }}>Planner</Link>
                <Link to="/library" className="rounded-md px-3 py-1.5 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted font-medium" }}>Library</Link>
                <Link to="/study-strategy" className="rounded-md px-3 py-1.5 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted font-medium" }}>Strategy</Link>
                <Link to="/onboarding" className="rounded-md px-3 py-1.5 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted font-medium" }}>Profile</Link>
              </>
            )}
            {!loading && !user && (
              <Link to="/login" className="ml-2"><Button size="sm">Sign in</Button></Link>
            )}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
