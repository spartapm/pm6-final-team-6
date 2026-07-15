import { type HTMLAttributes, type ReactNode } from "react";

type Variant = "soft" | "outline";

export default function Card({
  children,
  className = "",
  padded = true,
  variant = "soft",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padded?: boolean;
  /**
   * soft(기본): 피부프로필처럼 흰 면 + 그림자, 파란 테두리 없음
   * outline: 드물게 외곽이 필요할 때만
   */
  variant?: Variant;
}) {
  return (
    <div
      className={[
        "rounded-card",
        variant === "outline"
          ? "border border-sky/35 bg-white shadow-card"
          : "bg-white shadow-card",
        padded ? "p-4" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
