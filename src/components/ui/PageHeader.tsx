"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  right,
  center,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  right?: ReactNode;
  center?: boolean;
}) {
  const router = useRouter();

  const backButton = (
    <button
      type="button"
      aria-label="뒤로가기"
      className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-accent-faint"
      onClick={() => {
        if (onBack) onBack();
        else if (backHref) router.push(backHref);
        else router.back();
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <header className="page-pad pt-4">
      <div className={`flex items-start ${center ? "justify-between" : "gap-2"}`}>
        {backHref || onBack || !center ? backButton : <div className="h-10 w-10" />}
        <div className={`min-w-0 flex-1 ${center ? "text-center" : ""}`}>
          <h1 className="text-[22px] font-extrabold leading-tight text-ink">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{subtitle}</p>
          )}
        </div>
        <div className="flex h-10 min-w-10 items-center justify-end">{right}</div>
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-extrabold text-ink">{title}</h2>
      {actionHref ? (
        <Link href={actionHref} className="text-sm font-bold text-sky">
          {actionLabel ?? "더보기 >"}
        </Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className="text-sm font-bold text-sky">
          {actionLabel ?? "더보기 >"}
        </button>
      ) : null}
    </div>
  );
}
