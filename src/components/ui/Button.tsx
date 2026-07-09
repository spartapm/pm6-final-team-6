import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-float enabled:hover:brightness-[0.98] enabled:active:scale-[0.99]",
  secondary: "bg-accent-faint text-accent enabled:hover:bg-accent-soft/30",
  ghost: "bg-transparent text-ink-soft enabled:hover:bg-accent-faint",
  outline:
    "bg-surface-white text-accent border border-line enabled:hover:bg-accent-faint",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "lg",
  className = "",
  fullWidth,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-chip font-bold transition disabled:bg-accent-disabled disabled:text-ink-muted disabled:border-transparent disabled:shadow-none",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
