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
      className={`flex w-full items-center gap-3 rounded-panel border px-3 py-3 text-left transition ${
        selected ? "border-accent bg-accent-faint/50" : "border-line bg-surface-white"
      }`}
    >
      {left}
      <div className="min-w-0 flex-1 text-sm font-bold text-ink">{children}</div>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-accent" : "border-line"
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
      </span>
    </button>
  );
}
