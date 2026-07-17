"use client";

import * as React from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";

/**
 * Email + password sign-in (Supabase). No inbox round-trip needed — the moment
 * credentials are accepted the session is set and we go to the dashboard.
 *
 * "Create account" works instantly when the project has email confirmation
 * disabled (Auth → Providers → Email → "Confirm email" off).
 */
export function EmailSignIn() {
  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const { createClient } = await import("@/supabase/client");
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(error.message);
        } else if (data.session) {
          window.location.href = "/dashboard";
          return;
        } else {
          setNotice(
            "Account created. Email confirmation is on for this project — confirm via the email, or turn off “Confirm email” in Supabase to sign in instantly.",
          );
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(error.message);
        } else {
          window.location.href = "/dashboard";
          return;
        }
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    }
    setLoading(false);
  }

  const isSignup = mode === "signup";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@callourstudio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "At least 6 characters" : "••••••••"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
        />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {notice ? (
        <p className="text-muted-foreground text-sm">{notice}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={loading || email.trim().length === 0 || password.length < 6}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isSignup ? (
          <UserPlus className="size-4" />
        ) : (
          <LogIn className="size-4" />
        )}
        {isSignup ? "Create account" : "Sign in"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {isSignup ? "Already have an account?" : "New to Altiora?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "signin" : "signup");
            setError(null);
            setNotice(null);
          }}
          className="text-primary font-medium hover:underline"
        >
          {isSignup ? "Sign in" : "Create one"}
        </button>
      </p>
    </form>
  );
}
