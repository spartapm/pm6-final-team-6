"use client";

import { type ReactNode } from "react";

export default function RadioRow({
  selected,
  onClick,
  children,
  left,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  left?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-1 py-3 text-left transition"
    >
      {left}
      <div className="min-w-0 flex-1 text-sm font-bold text-ink">{children}</div>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
          selected ? "border-sky bg-sky text-white" : "border-sky bg-surface-card text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
}
