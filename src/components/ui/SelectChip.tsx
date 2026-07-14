"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

export default function SelectChip({
  children,
  selected,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        "rounded-chip border px-3 py-2.5 text-sm font-bold transition",
        selected
          ? "border-sky bg-sky text-white shadow-sm"
          : "border-sky bg-surface-card text-ink-soft enabled:hover:bg-sky-faint",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
