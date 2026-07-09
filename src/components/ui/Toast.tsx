"use client";

import { useAppState } from "@/lib/useAppState";

export default function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;

  return (
    <div className="toast-offset pointer-events-none fixed inset-x-0 z-[90] mx-auto flex max-w-phone justify-center px-4">
      <div className="animate-fade-up rounded-chip bg-ink px-4 py-3 text-sm font-bold text-white shadow-float">
        {toast}
      </div>
    </div>
  );
}
