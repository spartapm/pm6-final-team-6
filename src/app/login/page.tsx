"use client";

import { Suspense } from "react";
import LoginInner from "./LoginInner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-[100svh] max-w-phone bg-page px-4 py-10 text-center text-ink-muted">
          불러오는 중...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
