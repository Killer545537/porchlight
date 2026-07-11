"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CenterLoader } from "@/components/ui";
import { setToken } from "@/lib/api";

// The Google OAuth flow redirects here with ?token=<jwt>. We stash it and bounce
// to the app.
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      setToken(token);
      qc.invalidateQueries();
      router.replace("/");
    } else {
      router.replace("/auth");
    }
  }, [params, qc, router]);

  return <CenterLoader />;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<CenterLoader />}>
      <CallbackInner />
    </Suspense>
  );
}
