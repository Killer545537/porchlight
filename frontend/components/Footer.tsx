"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

export function Footer() {
  const { theme, toggle } = useTheme();
  return (
    <div className="border-t border-line">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-[clamp(16px,4vw,32px)] py-6">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-[18px] w-[18px] place-items-center rounded-porch bg-accent text-[9px] text-on-accent"
            aria-hidden
          >
            ◆
          </span>
          <span className="mono text-[10px] tracking-[0.14em] text-ink3">
            © 2026 PORCHLIGHT
          </span>
        </div>
        <div className="flex items-center gap-[18px]">
          <button
            type="button"
            onClick={toggle}
            className="mono cursor-pointer text-[12px] text-ink2 underline underline-offset-[3px] hover:text-ink"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <Link
            href="/host"
            className="mono text-[12px] text-ink2 no-underline hover:text-ink"
          >
            Become a host
          </Link>
        </div>
      </div>
    </div>
  );
}
