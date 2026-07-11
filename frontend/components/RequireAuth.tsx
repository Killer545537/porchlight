"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { CenterLoader, EmptyState } from "./ui";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthed, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) return <CenterLoader />;

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-24">
        <EmptyState
          title="Sign in to continue"
          body="This part of Porchlight is just for you — your trips, saves and listings."
          action={
            <Link
              href={`/auth?next=${encodeURIComponent(pathname)}`}
              className="rounded-porch bg-ink px-5 py-2.5 text-bg no-underline transition-transform active:scale-[0.97]"
              style={{ font: "600 14px var(--font-sans)" }}
            >
              Sign in →
            </Link>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
