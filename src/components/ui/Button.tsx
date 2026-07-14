import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "sky";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  /** 활성화 버튼 #7BA5FD */
  primary:
    "bg-sky text-white border border-sky shadow-float enabled:hover:brightness-[0.98] enabled:active:scale-[0.99]",
  /** 작은 임팩트 버튼 #FAEEF4 / 글씨 #FB89A3 */
  secondary: "bg-accent-faint text-accent border border-transparent enabled:hover:brightness-[0.98]",
  ghost: "bg-transparent text-ink-soft enabled:hover:bg-sky-faint",
  /** 기본 버튼 채우기 #F9FBFE · 외곽선 #7BA5FD */
  outline:
    "bg-surface-card text-ink border border-sky enabled:hover:bg-sky-faint",
  /** 오늘 루틴 기록하기 그라데이션 */
  sky: "btn-sky enabled:active:scale-[0.99]",
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
        "inline-flex items-center justify-center gap-2 rounded-chip font-bold transition disabled:bg-btn-disabled disabled:text-ink-muted disabled:border-transparent disabled:shadow-none disabled:brightness-100",
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
