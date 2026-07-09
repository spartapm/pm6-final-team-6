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
        "rounded-[12px] border px-3 py-2.5 text-sm font-bold transition",
        selected
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface-white text-ink enabled:hover:bg-accent-faint",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
