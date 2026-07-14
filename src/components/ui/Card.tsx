import { type HTMLAttributes, type ReactNode } from "react";

export default function Card({
  children,
  className = "",
  padded = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-card border border-line bg-surface-card shadow-card",
        padded ? "p-4" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
