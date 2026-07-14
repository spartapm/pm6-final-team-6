import { type HTMLAttributes, type ReactNode } from "react";

type Tone = "accent" | "soft" | "muted" | "outline";

const tones: Record<Tone, string> = {
  accent: "bg-accent text-white",
  soft: "bg-accent-faint text-accent",
  muted: "bg-surface-soft text-ink-soft",
  outline: "border border-line text-accent bg-surface-card",
};

export default function Badge({
  children,
  tone = "soft",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-bold",
        tones[tone],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
