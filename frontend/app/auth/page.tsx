"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CenterLoader, Kicker, Spinner } from "@/components/ui";
import { API_BASE, ApiError } from "@/lib/api";
import { useLogin, useSignup } from "@/lib/hooks";

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { isAuthed, user, logout } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();
  const signup = useSignup();
  const busy = login.isPending || signup.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signin") {
        await login.mutateAsync({ email, password });
      } else {
        await signup.mutateAsync({ name, email, password });
      }
      router.push(next);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Try again.",
      );
    }
  };

  if (isAuthed && user) {
    return (
      <div className="mx-auto w-full max-w-[440px] px-5 py-[clamp(36px,8vh,80px)]">
        <div className="grid gap-4 rounded-porch border border-line bg-surface p-[clamp(22px,4vw,34px)]">
          <h1
            style={{
              font: "600 24px/1.15 var(--font-sans)",
              letterSpacing: "-0.025em",
            }}
          >
            You&apos;re signed in
          </h1>
          <div className="flex items-center justify-between rounded-porch bg-surface2 px-3.5 py-2.5">
            <span style={{ font: "500 13px var(--font-sans)" }}>
              {user.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="mono cursor-pointer text-[12px] text-ink2 underline underline-offset-[3px] hover:text-ink"
            >
              Sign out
            </button>
          </div>
          <Link
            href="/explore"
            className="rounded-porch bg-ink px-5 py-3 text-center text-bg no-underline transition-transform active:scale-[0.98]"
            style={{ font: "600 15px var(--font-sans)" }}
          >
            Start exploring →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[440px] px-5 py-[clamp(36px,8vh,80px)]">
      <form
        onSubmit={submit}
        className="grid gap-[18px] rounded-porch border border-line bg-surface p-[clamp(22px,4vw,34px)]"
      >
        <Kicker>{mode === "signin" ? "WELCOME BACK" : "NEW HERE"}</Kicker>
        <div>
          <h1
            className="mb-1.5"
            style={{
              font: "600 26px/1.15 var(--font-sans)",
              letterSpacing: "-0.025em",
            }}
          >
            {mode === "signin"
              ? "Sign in to Porchlight"
              : "Create your account"}
          </h1>
          <p
            className="m-0 text-ink2"
            style={{ font: "400 14px/1.5 var(--font-sans)" }}
          >
            One account books stays and hosts places — no separate roles.
          </p>
        </div>

        {mode === "signup" && (
          <Field label="YOUR NAME">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last"
              autoComplete="name"
              className="w-full rounded-porch border border-line bg-bg px-3.5 py-3 text-ink outline-none focus:border-ink3"
              style={{ font: "500 14px var(--font-sans)" }}
            />
          </Field>
        )}
        <Field label="EMAIL">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere.com"
            autoComplete="email"
            required
            className="w-full rounded-porch border border-line bg-bg px-3.5 py-3 text-ink outline-none focus:border-ink3"
            style={{ font: "500 14px var(--font-sans)" }}
          />
        </Field>
        <Field label="PASSWORD">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              mode === "signup" ? "At least 8 characters" : "Your password"
            }
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            required
            minLength={8}
            className="w-full rounded-porch border border-line bg-bg px-3.5 py-3 text-ink outline-none focus:border-ink3"
            style={{ font: "500 14px var(--font-sans)" }}
          />
        </Field>

        {error && (
          <div
            style={{ font: "500 13px var(--font-sans)", color: "var(--bad)" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-porch bg-ink px-5 py-3.5 text-bg transition-transform active:scale-[0.98] disabled:opacity-70"
          style={{ font: "600 15px var(--font-sans)" }}
        >
          {busy && <Spinner size={15} />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="mono text-[10px] tracking-[0.14em] text-ink3">
            OR
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <a
          href={`${API_BASE}/auth/google/login`}
          className="rounded-porch border border-line bg-bg px-5 py-3 text-center text-ink no-underline transition-colors hover:border-ink3"
          style={{ font: "500 14px var(--font-sans)" }}
        >
          Continue with Google
        </a>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
          }}
          className="text-center text-ink2 hover:text-ink"
          style={{ font: "500 13px var(--font-sans)" }}
        >
          {mode === "signin"
            ? "New to Porchlight? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mono mb-1.5 text-[9.5px] tracking-[0.14em] text-ink3">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<CenterLoader />}>
      <AuthInner />
    </Suspense>
  );
}
