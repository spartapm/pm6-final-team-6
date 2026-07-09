"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { syncAuthState } from "@/lib/store";

function AuthCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const next = search.get("next") || "/";
      // recovery / magic link hash tokens are handled by supabase-js detectSessionInUrl
      await supabase.auth.getSession();
      await syncAuthState();
      if (!mounted) return;
      router.replace(next);
    })();
    return () => {
      mounted = false;
    };
  }, [router, search]);

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-phone items-center justify-center bg-page px-4 text-ink-muted">
      로그인 처리 중...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[100svh] max-w-phone items-center justify-center bg-page px-4 text-ink-muted">
          로그인 처리 중...
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
